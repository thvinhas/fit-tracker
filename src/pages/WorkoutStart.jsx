import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getExercises,
  updateExercise,
  addWorkoutLog,
  addExerciseLog,
  getExerciseLogs,
  addSession,
} from "../services/firestore";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import Button, { buttonGhostLinkClass } from "../components/Button";
import RestTimer from "../components/RestTimer";

const REP_CHIPS = [6, 8, 10, 12, 15];

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const WeightStepper = ({ value, onChange, disabled }) => (
  <div className="flex items-center justify-center gap-4">
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(clamp(value - 1, 0, 500))}
      className="h-14 w-14 rounded-2xl bg-surface2 border-border-subtle text-2xl font-bold text-text-primary hover:bg-surface3 hover:border-border-hover active:scale-95 disabled:opacity-30 transition-all shadow-inner-glow"
      aria-label="Diminuir peso"
    >
      −
    </button>
    <div className="min-w-[6rem] text-center">
      <span className="text-3xl font-extrabold tabular-nums text-text-primary tracking-tight">
        {value}
      </span>
      <span className="text-sm font-semibold text-text-muted ml-1">kg</span>
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(clamp(value + 1, 0, 500))}
      className="h-14 w-14 rounded-2xl bg-surface2 border-border-subtle text-2xl font-bold text-text-primary hover:bg-surface3 hover:border-border-hover active:scale-95 disabled:opacity-30 transition-all shadow-inner-glow"
      aria-label="Aumentar peso"
    >
      +
    </button>
  </div>
);

const RepChips = ({ value, onChange, disabled }) => (
  <div className="flex flex-wrap gap-2 justify-center">
    {REP_CHIPS.map((n) => {
      const active = value === n;
      return (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`min-w-[3rem] px-3 py-2.5 rounded-xl text-base font-bold tabular-nums transition-all duration-200 ${
            active
              ? "bg-gradient-primary text-zinc-950 shadow-glow scale-105"
              : "bg-surface2 text-text-tertiary border-border-subtle hover:border-border-hover hover:text-text-secondary hover:bg-surface3"
          } disabled:opacity-30`}
        >
          {n}
        </button>
      );
    })}
  </div>
);

const WorkoutStart = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [lastByExercise, setLastByExercise] = useState({});
  const [setStates, setSetStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [sessionStartTime] = useState(() => Date.now());
  const [prAlert, setPrAlert] = useState(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(90);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const exercisesData = await getExercises(id);
      setExercises(exercisesData);

      const lastMap = {};
      const initialSets = {};

      for (const exercise of exercisesData) {
        const logs = await getExerciseLogs(exercise.id);
        const last = logs[0];
        lastMap[exercise.id] = last || null;

        const n = Math.max(1, Number(exercise.sets) || 1);
        const defaultReps = Math.max(1, Number(exercise.reps) || 10);
        const defaultWeight = Math.max(
          0,
          Number(exercise.currentWeight) ||
            (last?.weight != null ? Number(last.weight) : 0),
        );

        initialSets[exercise.id] = Array.from({ length: n }, () => ({
          weight: defaultWeight,
          reps: last?.reps != null ? Number(last.reps) : defaultReps,
          completed: false,
        }));
      }

      setLastByExercise(lastMap);
      setSetStates(initialSets);

      // Auto-expand first incomplete exercise
      if (exercisesData.length > 0) {
        setExpandedExerciseId(exercisesData[0].id);
      }

      setLoading(false);
    };
    load();
  }, [id]);

  const updateSet = useCallback(
    (exerciseId, setIndex, patch) => {
      setSetStates((prev) => {
        const exerciseSets = prev[exerciseId];
        const updatedSets = exerciseSets.map((row, i) => {
          if (i === setIndex) {
            const newRow = { ...row, ...patch };

            // Check for PR when completing a set
            if (patch.completed === true && !row.completed) {
              const last = lastByExercise[exerciseId];
              const currentWeight = Number(newRow.weight) || 0;
              const currentReps = Number(newRow.reps) || 0;
              const lastWeight = last?.weight != null ? Number(last.weight) : 0;
              const lastReps = last?.reps != null ? Number(last.reps) : 0;

              const isWeightPR = currentWeight > lastWeight;
              const isRepsPR =
                currentReps > lastReps && currentWeight >= lastWeight;

              if (isWeightPR || isRepsPR) {
                const exercise = exercises.find((e) => e.id === exerciseId);
                setPrAlert({
                  exerciseName: exercise?.name || "Exercício",
                  type: isWeightPR ? "weight" : "reps",
                  value: isWeightPR ? currentWeight : currentReps,
                  unit: isWeightPR ? "kg" : "reps",
                  previous: isWeightPR ? lastWeight : lastReps,
                });

                // Auto-dismiss after 3 seconds
                setTimeout(() => setPrAlert(null), 3000);
              }

              // Auto-start rest timer
              setRestTimerActive(true);
              setRestTimerDuration(90);
            }

            return newRow;
          }
          if (i > setIndex && !row.completed) {
            if (patch.weight !== undefined) {
              return { ...row, weight: patch.weight };
            }
            if (patch.reps !== undefined) {
              return { ...row, reps: patch.reps };
            }
          }
          return row;
        });
        return {
          ...prev,
          [exerciseId]: updatedSets,
        };
      });
    },
    [lastByExercise, exercises],
  );

  const handleFinishWorkout = async () => {
    setIsFinishing(true);
    try {
      const sessionEndTime = Date.now();
      const duration = sessionEndTime - sessionStartTime;

      let totalVolume = 0;
      let completedSetsCount = 0;
      let completedExercisesCount = 0;
      const exerciseUpdates = [];
      const exerciseLogs = [];

      for (const exercise of exercises) {
        const rows = setStates[exercise.id] || [];
        let lastWeight = Number(exercise.currentWeight) || 0;
        let exerciseHasCompletedSets = false;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row.completed) continue;
          const w = Number(row.weight) || 0;
          const r = Number(row.reps) || 0;
          lastWeight = w;
          totalVolume += w * r;
          completedSetsCount++;
          exerciseHasCompletedSets = true;
        }

        if (exerciseHasCompletedSets) {
          completedExercisesCount++;
          exerciseUpdates.push(
            updateExercise(exercise.id, { currentWeight: lastWeight }),
          );
        }
      }

      if (completedSetsCount === 0) {
        toast.error("Complete pelo menos uma série para finalizar.");
        setIsFinishing(false);
        return;
      }

      // Parallel updates
      await Promise.all(exerciseUpdates);

      const sessionRef = await addSession({
        workoutId: id,
        userId: user.uid,
        date: new Date(),
        duration,
        totalVolume,
        exerciseCount: completedExercisesCount,
        setCount: completedSetsCount,
      });

      const sessionId = sessionRef.id;

      // Collect all logs in parallel
      for (const exercise of exercises) {
        const rows = setStates[exercise.id] || [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row.completed) continue;
          const w = Number(row.weight) || 0;
          const r = Number(row.reps) || 0;
          exerciseLogs.push(
            addExerciseLog({
              exerciseId: exercise.id,
              weight: w,
              reps: r,
              setIndex: i + 1,
              workoutId: id,
              sessionId,
              date: new Date(),
            }),
          );
        }
      }

      // Parallel log creation
      await Promise.all(exerciseLogs);

      await addWorkoutLog({
        workoutId: id,
        userId: user.uid,
        date: new Date(),
      });

      toast.success("Treino concluído!");
      navigate(`/workout/${id}/completion`, { replace: true });
    } catch (error) {
      toast.error("Erro ao finalizar: " + error.message);
      setIsFinishing(false);
    }
  };

  const lastLabel = useCallback(
    (exerciseId) => {
      const last = lastByExercise[exerciseId];
      if (!last) return null;
      const w = last.weight != null ? `${last.weight} kg` : null;
      const r = last.reps != null ? `${last.reps} reps` : null;
      if (w && r) return `${w} × ${r}`;
      if (w) return w;
      return null;
    },
    [lastByExercise],
  );

  const completedCount = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      const rows = setStates[ex.id] || [];
      return acc + rows.filter((r) => r.completed).length;
    }, 0);
  }, [exercises, setStates]);

  const totalSets = useMemo(() => {
    return exercises.reduce(
      (acc, ex) => acc + (setStates[ex.id]?.length || 0),
      0,
    );
  }, [exercises, setStates]);

  const handleExerciseClick = (exerciseId) => {
    setExpandedExerciseId(
      expandedExerciseId === exerciseId ? null : exerciseId,
    );
  };

  const getNextIncompleteExercise = () => {
    for (const exercise of exercises) {
      const rows = setStates[exercise.id] || [];
      if (rows.some((r) => !r.completed)) {
        return exercise.id;
      }
    }
    return null;
  };

  const handleRestTimerComplete = () => {
    setRestTimerActive(false);
    const nextExerciseId = getNextIncompleteExercise();
    if (nextExerciseId) {
      setExpandedExerciseId(nextExerciseId);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin"
          aria-hidden
        />
        <p className="text-sm text-text-muted font-medium">
          Preparando treino…
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-background">
      <RestTimer
        isActive={restTimerActive}
        duration={restTimerDuration}
        onComplete={handleRestTimerComplete}
        onDismiss={() => setRestTimerActive(false)}
      />

      <AnimatePresence>
        {prAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto"
          >
            <div className="bg-gradient-primary text-black rounded-2xl p-4 shadow-glow-lg flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                className="text-3xl"
              >
                🔥
              </motion.div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                  Novo PR!
                </p>
                <p className="text-lg font-extrabold leading-tight">
                  {prAlert.exerciseName}
                </p>
                <p className="text-sm font-semibold">
                  {prAlert.type === "weight"
                    ? `+${prAlert.value - prAlert.previous}kg`
                    : `+${prAlert.value - prAlert.previous} reps`}
                  <span className="opacity-70 ml-1">
                    ({prAlert.previous} → {prAlert.value} {prAlert.unit})
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/workout/${id}`} className={buttonGhostLinkClass}>
            ← Voltar
          </Link>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
              Progresso
            </p>
            <p className="text-lg font-black text-primary tabular-nums tracking-tight">
              {completedCount}/{totalSets}
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-black text-text-primary tracking-tight mb-2">
          Sessão ativa
        </h1>
        <p className="text-sm text-text-tertiary">
          Foco. Intensidade. Progresso.
        </p>
      </div>

      <div className="px-4 space-y-3">
        {exercises.length === 0 ? (
          <p className="text-center text-text-muted py-12 text-sm">
            Nenhum exercício neste treino.
          </p>
        ) : (
          exercises.map((exercise, exerciseIndex) => {
            const rows = setStates[exercise.id] || [];
            const isExpanded = expandedExerciseId === exercise.id;
            const completedSets = rows.filter((r) => r.completed).length;
            const totalExerciseSets = rows.length;
            const isComplete = completedSets === totalExerciseSets;

            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: exerciseIndex * 0.03 }}
              >
                {/* Collapsed state - compact card */}
                {!isExpanded && (
                  <motion.button
                    type="button"
                    onClick={() => handleExerciseClick(exercise.id)}
                    className={`w-full p-4 rounded-2xl border transition-all duration-300 text-left ${
                      isComplete
                        ? "bg-surface2 border-border-subtle opacity-60"
                        : "bg-surface3 border-border-subtle hover:border-border-hover active:scale-[0.98]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-text-primary truncate">
                          {exercise.name}
                        </h3>
                        <p className="text-xs text-text-tertiary mt-1">
                          {completedSets}/{totalExerciseSets} sets
                          {isComplete && " ✓"}
                        </p>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isComplete
                            ? "bg-primary/20 text-primary"
                            : "bg-surface4 text-text-muted"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </motion.button>
                )}

                {/* Expanded state - full cockpit */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="bg-surface3 border-2 border-primary/30 rounded-2xl overflow-hidden shadow-glow-sm"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-xl font-black text-text-primary leading-tight">
                              {exercise.name}
                            </h2>
                            <p className="text-xs text-text-tertiary mt-1">
                              {completedSets}/{totalExerciseSets} sets
                              concluídos
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedExerciseId(null)}
                            className="w-8 h-8 rounded-full bg-surface4 text-text-muted flex items-center justify-center hover:bg-surface2 hover:text-text-secondary transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-3">
                          {rows.map((row, setIndex) => (
                            <div
                              key={setIndex}
                              className={`p-4 rounded-xl transition-all duration-300 ${
                                row.completed
                                  ? "bg-primary/10 border border-primary/20"
                                  : "bg-surface2 border border-border-subtle"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                  Set {setIndex + 1}
                                </span>
                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    updateSet(exercise.id, setIndex, {
                                      completed: !row.completed,
                                    })
                                  }
                                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                    row.completed
                                      ? "border-primary bg-primary text-black shadow-glow-xs"
                                      : "border-border-subtle text-text-muted hover:border-primary/50 hover:text-primary"
                                  }`}
                                  aria-label={
                                    row.completed
                                      ? "Desmarcar série"
                                      : "Concluir série"
                                  }
                                >
                                  <AnimatePresence mode="wait" initial={false}>
                                    {row.completed ? (
                                      <motion.svg
                                        key="check"
                                        initial={{
                                          scale: 0.3,
                                          opacity: 0,
                                          rotate: -20,
                                        }}
                                        animate={{
                                          scale: 1,
                                          opacity: 1,
                                          rotate: 0,
                                        }}
                                        exit={{
                                          scale: 0.3,
                                          opacity: 0,
                                          rotate: 20,
                                        }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 300,
                                          damping: 20,
                                        }}
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </motion.svg>
                                    ) : (
                                      <motion.div
                                        key="dot"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 25,
                                        }}
                                        className="h-2 w-2 rounded-full bg-text-muted"
                                      />
                                    )}
                                  </AnimatePresence>
                                </motion.button>
                              </div>

                              <div
                                className={`space-y-3 ${row.completed ? "opacity-40 pointer-events-none" : ""}`}
                              >
                                <WeightStepper
                                  value={Number(row.weight) || 0}
                                  onChange={(w) =>
                                    updateSet(exercise.id, setIndex, {
                                      weight: w,
                                    })
                                  }
                                  disabled={row.completed}
                                />
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-2 text-center">
                                    Reps
                                  </p>
                                  <RepChips
                                    value={Number(row.reps) || 0}
                                    onChange={(reps) =>
                                      updateSet(exercise.id, setIndex, { reps })
                                    }
                                    disabled={row.completed}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button size="lg" onClick={handleFinishWorkout} disabled={isFinishing}>
          {isFinishing ? (
            <span className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Finalizando...
            </span>
          ) : (
            "Finalizar treino"
          )}
        </Button>
      </div>
    </div>
  );
};

export default WorkoutStart;
