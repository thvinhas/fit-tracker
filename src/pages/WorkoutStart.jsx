import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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

const REP_OPTIONS = [6, 8, 10, 12, 15];

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Compact weight stepper - responsive sizes for different screens
const CompactWeightStepper = ({ value, onChange, disabled, label = "kg" }) => (
  <div className="flex items-center gap-0.5 sm:gap-1">
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => onChange(clamp(value - 1, 0, 500))}
      className="h-9 w-9 sm:h-11 sm:w-11 rounded-[12px] sm:rounded-[14px] bg-surface2 border border-border-subtle text-xs sm:text-sm font-bold text-text-primary hover:bg-surface3 hover:border-border-hover disabled:opacity-30 transition-all shadow-sm"
      aria-label="Diminuir peso"
    >
      −
    </motion.button>
    <div className="min-w-[3rem] sm:min-w-[4rem] text-center px-0.5 sm:px-1">
      <motion.span
        key={value}
        initial={{ scale: 1.2, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-[22px] sm:text-[28px] font-bold tabular-nums text-text-primary leading-none"
      >
        {value}
      </motion.span>
      <span className="text-[10px] sm:text-[12px] font-semibold text-text-muted ml-0.5 opacity-70">
        {label}
      </span>
    </div>
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => onChange(clamp(value + 1, 0, 500))}
      className="h-9 w-9 sm:h-11 sm:w-11 rounded-[12px] sm:rounded-[14px] bg-surface2 border border-border-subtle text-xs sm:text-sm font-bold text-text-primary hover:bg-surface3 hover:border-border-hover disabled:opacity-30 transition-all shadow-sm"
      aria-label="Aumentar peso"
    >
      +
    </motion.button>
  </div>
);

// Mini rep selector popover
const RepSelector = ({ value, onChange, onClose, position }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="absolute z-50 bg-surface2 border border-border-subtle rounded-xl shadow-surface-xl p-2 flex gap-1"
      style={{
        top: position?.top || "auto",
        left: position?.left || "auto",
        right: position?.right || "auto",
        bottom: position?.bottom || "auto",
      }}
    >
      {REP_OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => {
            onChange(n);
            onClose();
          }}
          className={`w-10 h-10 rounded-lg text-sm font-bold tabular-nums transition-all ${
            value === n
              ? "bg-primary text-black shadow-glow-sm"
              : "bg-surface3 text-text-tertiary hover:bg-surface4 hover:text-text-secondary"
          }`}
        >
          {n}
        </button>
      ))}
    </motion.div>
  );
};

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
  const [activeSetId, setActiveSetId] = useState(null);
  const [repSelectorOpen, setRepSelectorOpen] = useState(null);
  const [repSelectorPosition, setRepSelectorPosition] = useState(null);
  const repSelectorRef = useRef(null);
  // const [restTimerActive, setRestTimerActive] = useState(false);
  // const [restTimerDuration, setRestTimerDuration] = useState(90);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

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

      // Auto-expand first incomplete exercise and set
      if (exercisesData.length > 0) {
        const firstExerciseId = exercisesData[0].id;
        setExpandedExerciseId(firstExerciseId);
        setActiveSetId(`${firstExerciseId}-0`);
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
              // setRestTimerActive(true);
              // setRestTimerDuration(90);

              // Auto-advance to next incomplete set
              const nextSetIndex = exerciseSets.findIndex(
                (r, i) => i > setIndex && !r.completed,
              );
              if (nextSetIndex !== -1) {
                setActiveSetId(`${exerciseId}-${nextSetIndex}`);
              } else {
                // Move to next exercise
                const nextExerciseIndex =
                  exercises.findIndex((e, i) => e.id === exerciseId) + 1;
                if (nextExerciseIndex < exercises.length) {
                  const nextExerciseId = exercises[nextExerciseIndex].id;
                  setExpandedExerciseId(nextExerciseId);
                  setActiveSetId(`${nextExerciseId}-0`);
                }
              }
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
    // Check if all exercises are completed
    if (completedCount < totalSets) {
      setShowFinishConfirm(true);
      return;
    }

    // All exercises completed, proceed directly
    await finishWorkout();
  };

  const finishWorkout = async () => {
    setIsFinishing(true);
    setShowFinishConfirm(false);
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

  const completedExercises = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      const rows = setStates[ex.id] || [];
      const isComplete = rows.length > 0 && rows.every((r) => r.completed);
      return acc + (isComplete ? 1 : 0);
    }, 0);
  }, [exercises, setStates]);

  const totalExercises = exercises.length;

  const handleExerciseClick = (exerciseId) => {
    setExpandedExerciseId(
      expandedExerciseId === exerciseId ? null : exerciseId,
    );
    if (expandedExerciseId !== exerciseId) {
      // Find first incomplete set in this exercise
      const rows = setStates[exerciseId] || [];
      const firstIncompleteIndex = rows.findIndex((r) => !r.completed);
      setActiveSetId(
        `${exerciseId}-${firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0}`,
      );
    }
  };

  const handleSetClick = (exerciseId, setIndex) => {
    setActiveSetId(`${exerciseId}-${setIndex}`);
  };

  const handleRepSelectorOpen = (e, exerciseId, setIndex) => {
    const rect = e.target.getBoundingClientRect();
    setRepSelectorPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });
    setRepSelectorOpen(`${exerciseId}-${setIndex}`);
  };

  const handleRepSelectorClose = () => {
    setRepSelectorOpen(null);
    setRepSelectorPosition(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        repSelectorRef.current &&
        !repSelectorRef.current.contains(e.target)
      ) {
        handleRepSelectorClose();
      }
    };
    if (repSelectorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [repSelectorOpen]);

  const getNextIncompleteExercise = () => {
    for (const exercise of exercises) {
      const rows = setStates[exercise.id] || [];
      if (rows.some((r) => !r.completed)) {
        return exercise.id;
      }
    }
    return null;
  };

  // const handleRestTimerComplete = () => {
  //   setRestTimerActive(false);
  //   const nextExerciseId = getNextIncompleteExercise();
  //   if (nextExerciseId) {
  //     setExpandedExerciseId(nextExerciseId);
  //   }
  // };

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
      {/* <RestTimer
        isActive={restTimerActive}
        duration={restTimerDuration}
        onComplete={handleRestTimerComplete}
        onDismiss={() => setRestTimerActive(false)}
      /> */}

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

      <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-1.5 sm:pb-2">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <Link to={`/workout/${id}`} className={buttonGhostLinkClass}>
            ← Voltar
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-text-muted font-bold">
                Progresso
              </p>
              <p className="text-base sm:text-lg font-black text-primary tabular-nums tracking-tight">
                {completedExercises}/{totalExercises}
              </p>
            </div>
          </div>
        </div>

        <h1 className="text-lg sm:text-xl font-black text-text-primary tracking-tight mb-0.5 sm:mb-1">
          Sessão ativa
        </h1>
        <p className="text-[11px] sm:text-xs text-text-tertiary">
          Foco. Intensidade. Progresso.
        </p>
      </div>

      <div className="px-3 sm:px-4 space-y-1.5 sm:space-y-2">
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
            const last = lastByExercise[exercise.id];
            const lastLabel =
              last && last.weight != null && last.reps != null
                ? `Último: ${last.weight}kg × ${last.reps}`
                : null;

            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: exerciseIndex * 0.02 }}
              >
                {/* Exercise Card */}
                <div
                  className={`rounded-xl border transition-all duration-300 ${
                    isExpanded
                      ? "bg-surface3 border-primary/40 shadow-glow-sm"
                      : isComplete
                        ? "bg-primary/5 border-primary/30"
                        : "bg-surface2 border-border-subtle hover:border-border-hover"
                  }`}
                >
                  {/* Exercise Header - Always Visible */}
                  <button
                    type="button"
                    onClick={() => handleExerciseClick(exercise.id)}
                    className="w-full p-2 sm:p-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Equipment and Number - Left Corner (#2 highlighted) */}
                          <div className="flex items-center gap-1.5">
                            {exercise.device && (
                              <span className="text-[10px] sm:text-[12px] font-bold text-primary bg-primary/20 px-2 sm:px-2.5 py-0.5 rounded-full border border-primary/30">
                                {exercise.device}
                              </span>
                            )}
                          </div>
                          {/* Exercise Name - (#1 highlighted) */}
                          <h3
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isComplete ? "text-primary" : "text-text-primary"
                            }`}
                          >
                            {exercise.name}
                          </h3>
                          {isComplete && (
                            <span className="text-[9px] sm:text-[10px] font-semibold text-primary bg-primary/20 px-1.5 sm:px-2 py-0.5 rounded-full">
                              Concluído
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                          <p
                            className={`text-[10px] sm:text-[11px] ${
                              isComplete ? "text-primary" : "text-text-tertiary"
                            }`}
                          >
                            {completedSets}/{totalExerciseSets} sets
                          </p>
                          {lastLabel && (
                            <span className="text-[10px] sm:text-[11px] text-text-muted">
                              • {lastLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {isComplete && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-black flex items-center justify-center"
                          >
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
                            </svg>
                          </motion.div>
                        )}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/6 flex items-center justify-center"
                        >
                          <svg
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-muted"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Sets - Compact Rows */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="border-t border-border-subtle"
                      >
                        <div className="p-1.5 sm:p-2 space-y-1">
                          {rows.map((row, setIndex) => {
                            const setActive =
                              activeSetId === `${exercise.id}-${setIndex}`;
                            const setKey = `${exercise.id}-${setIndex}`;

                            return (
                              <motion.div
                                key={setIndex}
                                layout
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                                className={`relative rounded-lg transition-all duration-200 ${
                                  setActive
                                    ? "bg-surface4 border border-primary/40 shadow-glow-sm"
                                    : row.completed
                                      ? "bg-primary/5 border border-primary/10"
                                      : "bg-surface2 border border-border-subtle hover:border-border-hover"
                                }`}
                              >
                                {/* Compact Set Row */}
                                <div
                                  className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 min-h-[60px] sm:min-h-[72px] ${setActive ? "bg-gradient-to-r from-primary/5 to-transparent" : ""}`}
                                >
                                  {/* Set Number & Check */}
                                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-[3rem] sm:min-w-[4rem]">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                      {setIndex + 1}
                                    </span>
                                    <motion.button
                                      type="button"
                                      whileTap={{ scale: 0.85 }}
                                      whileHover={{ scale: 1.05 }}
                                      onClick={() => {
                                        updateSet(exercise.id, setIndex, {
                                          completed: !row.completed,
                                        });
                                        if (!row.completed) {
                                          setActiveSetId(setKey);
                                        }
                                      }}
                                      className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-[12px] sm:rounded-[14px] border transition-all duration-200 ${
                                        row.completed
                                          ? "border-primary bg-primary text-black shadow-glow-sm"
                                          : setActive
                                            ? "border-primary/50 text-primary hover:border-primary hover:bg-primary/10"
                                            : "border-border-subtle text-text-muted hover:border-primary/50 hover:text-primary"
                                      }`}
                                      aria-label={
                                        row.completed
                                          ? "Desmarcar série"
                                          : "Concluir série"
                                      }
                                    >
                                      <AnimatePresence
                                        mode="wait"
                                        initial={false}
                                      >
                                        {row.completed ? (
                                          <motion.svg
                                            key="check"
                                            initial={{ scale: 0.3, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.3, opacity: 0 }}
                                            transition={{
                                              type: "spring",
                                              stiffness: 400,
                                              damping: 20,
                                            }}
                                            className="h-[14px] w-[14px]"
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
                                            className="h-[14px] w-[14px] rounded-full bg-text-muted"
                                          />
                                        )}
                                      </AnimatePresence>
                                    </motion.button>
                                  </div>

                                  {/* Weight Stepper - Always visible but compact */}
                                  <div
                                    className={`flex-1 ${row.completed ? "opacity-40 pointer-events-none" : ""}`}
                                  >
                                    <CompactWeightStepper
                                      value={Number(row.weight) || 0}
                                      onChange={(w) =>
                                        updateSet(exercise.id, setIndex, {
                                          weight: w,
                                        })
                                      }
                                      disabled={row.completed}
                                    />
                                  </div>

                                  {/* Repetition Count - Visual Display */}
                                  <div className="flex flex-col items-center min-w-[4rem] sm:min-w-[5rem]">
                                    <div className="flex items-center">
                                      <span
                                        className={`text-base sm:text-lg font-bold tabular-nums ${
                                          row.completed
                                            ? "text-primary"
                                            : "text-text-primary"
                                        }`}
                                      >
                                        x
                                      </span>
                                      <span
                                        className={`text-base sm:text-lg font-bold tabular-nums ${
                                          row.completed
                                            ? "text-primary"
                                            : "text-text-primary"
                                        }`}
                                      >
                                        {row.reps}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] sm:text-xs font-medium ${
                                        row.completed
                                          ? "text-primary"
                                          : "text-text-muted"
                                      }`}
                                    >
                                      reps
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-background via-background to-transparent">
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

      <AnimatePresence>
        {showFinishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFinishConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-surface2 border border-border-subtle rounded-2xl p-4 sm:p-5 max-w-sm w-full shadow-surface-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-2">
                Finalizar treino incompleto?
              </h3>
              <p className="text-sm text-text-secondary mb-4 sm:mb-5">
                Você completou {completedCount} de {totalSets} séries. Deseja
                finalizar mesmo assim?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowFinishConfirm(false)}
                >
                  Continuar treino
                </Button>
                <Button size="md" className="flex-1" onClick={finishWorkout}>
                  Finalizar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutStart;
