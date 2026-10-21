import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getExercises,
  updateExercise,
  addWorkoutLog,
  addExerciseLog,
  getExerciseLogs,
  getLastPerformance,
  addSession,
  getSessions,
} from "../services/firestore";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import Button, { buttonGhostLinkClass } from "../components/Button";
import RestTimer from "../components/RestTimer";
import {
  iniciarTreino,
  fecharTreino,
  avisarTempoExcedido,
} from "../services/workoutNotification";
import { pluralize } from "../utils/pluralize";
import WeightDisplay from "../components/WeightDisplay";
import {
  getEquipmentAbbreviation,
  getProgressionIncrementKg,
} from "../utils/equipment";
import { estimateDurationMs } from "../utils/estimateDuration";
import { useWorkoutPersistence } from "../hooks/useWorkoutPersistence";

const roundToRealisticWeight = (weightKg, incrementKg) =>
  Math.round(weightKg / incrementKg) * incrementKg;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const SET_TYPES = ["normal", "warmup", "drop", "failure"];
const SET_TYPE_LABELS = {
  normal: "Normal",
  warmup: "Aquec.",
  drop: "Drop",
  failure: "Falha",
};
const SET_TYPE_STYLES = {
  normal: "border-border-subtle text-text-muted hover:border-border-hover",
  warmup: "border-secondary/40 text-secondary bg-secondaryDim",
  drop: "border-primary/40 text-primary bg-primary/10",
  failure: "border-danger/40 text-danger bg-dangerDim",
};
const nextSetType = (current) => {
  const index = SET_TYPES.indexOf(current || "normal");
  return SET_TYPES[(index + 1) % SET_TYPES.length];
};

const getFallbackWarmup = (exercise) => {
  const workingWeight = Number(exercise?.currentWeight) || 0;
  if (workingWeight <= 0) return "Barra vazia × 10, 50% × 8, 70% × 5";
  const half = Math.round(workingWeight * 0.5);
  const seventy = Math.round(workingWeight * 0.7);
  return `Barra vazia × 10, ${half}kg × 8, ${seventy}kg × 5`;
};

// Compact weight stepper - much smaller with premium motion
const CompactWeightStepper = ({ value, onChange, disabled }) => (
  <div className="flex items-center gap-1">
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => onChange(clamp(value - 1, 0, 500))}
      className="h-11 w-11 rounded-[10px] bg-surface2 border border-border-subtle text-xs font-bold text-text-primary hover:bg-surface3 hover:border-border-hover disabled:opacity-30 transition-all shadow-sm"
      aria-label="Diminuir peso"
    >
      −
    </motion.button>
    <motion.div key={value} initial={{ scale: 1.2, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}>
      <WeightDisplay kg={value} size="lg" className="min-w-[3.5rem] items-center px-1" />
    </motion.div>
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => onChange(clamp(value + 1, 0, 500))}
      className="h-11 w-11 rounded-[10px] bg-surface2 border border-border-subtle text-xs font-bold text-text-primary hover:bg-surface3 hover:border-border-hover disabled:opacity-30 transition-all shadow-sm"
      aria-label="Aumentar peso"
    >
      +
    </motion.button>
  </div>
);

const WorkoutStart = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  // offline storage removed — use direct Firestore calls
  const [exercises, setExercises] = useState([]);
  const [lastByExercise, setLastByExercise] = useState({});
  const [progressionSuggestions, setProgressionSuggestions] = useState({});
  const [setStates, setSetStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState(() => Date.now());
  const [prAlert, setPrAlert] = useState(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  const [activeSetId, setActiveSetId] = useState(null);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(90);
  const [warmupSuggestion, setWarmupSuggestion] = useState(null);
  const [gifModal, setGifModal] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pastAvgDurationMs, setPastAvgDurationMs] = useState(null);
  const sessionHadPRRef = useRef(false);
  const overrunNotifiedRef = useRef(false);

  const applyRestoredState = useCallback((saved) => {
    if (!saved || saved.workoutId !== id) return;
    if (saved.setStates) setSetStates(saved.setStates);
    if (saved.expandedExerciseId !== undefined) {
      setExpandedExerciseId(saved.expandedExerciseId);
    }
    if (saved.activeSetId !== undefined) setActiveSetId(saved.activeSetId);
    if (saved.sessionStartTime) setSessionStartTime(saved.sessionStartTime);
  }, [id]);

  const persistedState = useMemo(
    () => ({
      workoutId: id,
      setStates,
      expandedExerciseId,
      activeSetId,
      sessionStartTime,
    }),
    [id, setStates, expandedExerciseId, activeSetId, sessionStartTime],
  );

  const { clearState: clearPersistedState, loadState: loadPersistedState } =
    useWorkoutPersistence(persistedState, applyRestoredState);

  useEffect(() => {
    iniciarTreino();
  }, []);

  useEffect(() => {
    if (!id || !user) return;
    let isMounted = true;

    getSessions(user.uid)
      .then((sessions) => {
        if (!isMounted) return;
        const pastSessions = sessions
          .filter((s) => s.workoutId === id)
          .slice(0, 5);
        if (pastSessions.length === 0) return;
        const avg =
          pastSessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0) /
          pastSessions.length;
        if (avg > 0) setPastAvgDurationMs(avg);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const exercisesData = await getExercises(id);
        if (!isMounted) return;

        setExercises(exercisesData);

        const [logsByExercise, lastPerformanceByExercise] = await Promise.all([
          Promise.all(exercisesData.map((exercise) => getExerciseLogs(exercise.id))),
          Promise.all(exercisesData.map((exercise) => getLastPerformance(exercise.id))),
        ]);

        const lastMap = {};
        const initialSets = {};
        const suggestions = {};

        exercisesData.forEach((exercise, index) => {
          const logs = logsByExercise[index] || [];
          const last = lastPerformanceByExercise[index];
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
            type: "normal",
          }));

          if (last?.sessionId) {
            const lastSessionLogs = logs.filter(
              (l) => l.sessionId === last.sessionId,
            );
            const targetReps = Number(exercise.reps) || 0;
            const completedAllSets = lastSessionLogs.length >= n;
            const metTargetReps =
              targetReps > 0 &&
              lastSessionLogs.every((l) => Number(l.reps) >= targetReps);

            if (completedAllSets && metTargetReps) {
              const incrementKg = getProgressionIncrementKg(
                exercise.equipment,
                exercise.device,
              );
              suggestions[exercise.id] = roundToRealisticWeight(
                defaultWeight + incrementKg,
                incrementKg,
              );
            }
          }
        });

        if (!isMounted) return;
        setLastByExercise(lastMap);
        setProgressionSuggestions(suggestions);

        const saved = loadPersistedState();
        if (saved && saved.workoutId === id && saved.setStates) {
          setSetStates(
            exercisesData.reduce((acc, exercise) => {
              acc[exercise.id] =
                saved.setStates[exercise.id] || initialSets[exercise.id];
              return acc;
            }, {}),
          );
          if (saved.expandedExerciseId !== undefined) {
            setExpandedExerciseId(saved.expandedExerciseId);
          }
          if (saved.activeSetId !== undefined) {
            setActiveSetId(saved.activeSetId);
          }
          if (saved.sessionStartTime) setSessionStartTime(saved.sessionStartTime);
        } else {
          setSetStates(initialSets);
          if (exercisesData.length > 0) {
            const firstExerciseId = exercisesData[0].id;
            setExpandedExerciseId(firstExerciseId);
            setActiveSetId(`${firstExerciseId}-0`);
          }
        }
      } catch (error) {
        console.error("Error loading workout start data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [id, user, loadPersistedState]);

  useEffect(() => {
    if (exercises.length === 0) return;

    let isMounted = true;
    fetch("/api/warmup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exercises: exercises.map((e) => ({
          name: e.name,
          device: e.device,
          currentWeight: e.currentWeight,
        })),
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!isMounted) return;
        if (res.ok && data?.suggestion) {
          setWarmupSuggestion(data.suggestion);
        } else {
          console.error(
            `[warmup] Falha ao carregar aquecimento (status ${res.status}): ${data?.error || "resposta vazia"}`,
          );
        }
      })
      .catch((error) => {
        console.error("[warmup] Erro de rede ao chamar /api/warmup:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [exercises]);

  const updateSet = useCallback(
    (exerciseId, setIndex, patch) => {
      setSetStates((prev) => {
        const exerciseSets = prev[exerciseId];
        const updatedSets = exerciseSets.map((row, i) => {
          if (i === setIndex) {
            const newRow = { ...row, ...patch };

            // Check for PR when completing a set (aquecimento não conta)
            if (
              patch.completed === true &&
              !row.completed &&
              newRow.type !== "warmup"
            ) {
              const last = lastByExercise[exerciseId];
              const currentWeight = Number(newRow.weight) || 0;
              const currentReps = Number(newRow.reps) || 0;
              const lastWeight = last?.weight != null ? Number(last.weight) : 0;
              const lastReps = last?.reps != null ? Number(last.reps) : 0;

              const isWeightPR = currentWeight > lastWeight;
              const isRepsPR =
                currentReps > lastReps && currentWeight >= lastWeight;

              if (isWeightPR || isRepsPR) {
                sessionHadPRRef.current = true;
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

              // Auto-advance to next incomplete set
              const nextSetIndex = exerciseSets.findIndex(
                (r, i) => i > setIndex && !r.completed,
              );
              const hasMoreWork =
                nextSetIndex !== -1 ||
                exercises.findIndex((e) => e.id === exerciseId) <
                  exercises.length - 1;

              // Auto-start rest timer, unless that was the very last set
              if (hasMoreWork) {
                setRestTimerDuration(90);
                setRestTimerActive(true);
              }

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
          if (row.type !== "warmup") {
            lastWeight = w;
            totalVolume += w * r;
          }
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

      // Apply updates
      await Promise.all(exerciseUpdates);

      const sessionRef = await addSession({
        workoutId: id,
        userId: user.uid,
        date: new Date(),
        duration,
        totalVolume,
        exerciseCount: completedExercisesCount,
        setCount: completedSetsCount,
        hasPR: sessionHadPRRef.current,
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
          const logData = {
            exerciseId: exercise.id,
            weight: w,
            reps: r,
            setIndex: i + 1,
            workoutId: id,
            sessionId,
            date: new Date(),
            muscleGroup: exercise.muscleGroup || null,
            type: row.type || "normal",
          };
          exerciseLogs.push(addExerciseLog(logData));
        }
      }

      // Parallel log creation
      await Promise.all(exerciseLogs);

      await addWorkoutLog({
        workoutId: id,
        userId: user.uid,
        date: new Date(),
      });

      clearPersistedState();
      fecharTreino();
      toast.success("Treino concluído!");
      navigate(`/workout/${id}/completion`, { replace: true });
    } catch (error) {
      toast.error("Erro ao finalizar: " + error.message);
      setIsFinishing(false);
    }
  };

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

  const estimatedDurationMs = useMemo(() => {
    if (pastAvgDurationMs != null) return pastAvgDurationMs;
    if (totalSets === 0) return null;
    return estimateDurationMs(totalSets);
  }, [pastAvgDurationMs, totalSets]);

  useEffect(() => {
    if (!estimatedDurationMs || overrunNotifiedRef.current) return;

    const remaining = estimatedDurationMs - (Date.now() - sessionStartTime);
    const notify = () => {
      overrunNotifiedRef.current = true;
      avisarTempoExcedido();
    };

    if (remaining <= 0) {
      notify();
      return;
    }

    const timeoutId = setTimeout(notify, remaining);
    return () => clearTimeout(timeoutId);
  }, [estimatedDurationMs, sessionStartTime]);

  const totalExercises = exercises.length;

  const handleBackClick = () => {
    if (completedCount > 0) {
      setShowExitConfirm(true);
    } else {
      navigate(`/workout/${id}`);
    }
  };

  const handleCancelWorkout = () => {
    clearPersistedState();
    setShowCancelConfirm(false);
    navigate(`/workout/${id}`);
  };

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

  const handleRestTimerComplete = () => {
    setRestTimerActive(false);
  };

  const applyProgressionSuggestion = useCallback((exerciseId, weight) => {
    setSetStates((prev) => {
      const rows = prev[exerciseId];
      if (!rows) return prev;
      return {
        ...prev,
        [exerciseId]: rows.map((row) =>
          row.completed ? row : { ...row, weight },
        ),
      };
    });
    setProgressionSuggestions((prev) => {
      const rest = { ...prev };
      delete rest[exerciseId];
      return rest;
    });
  }, []);

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
        startMinimized
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
            <div className="bg-primary text-[#181510] rounded-2xl p-4 shadow-glow-lg flex items-center gap-4">
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

      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={handleBackClick}
            className={buttonGhostLinkClass}
          >
            ← Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                Progresso
              </p>
              <p className="text-lg font-black text-primary tabular-nums tracking-tight">
                {completedCount}/{totalSets}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="text-xs font-bold text-danger hover:text-danger/80 transition-colors px-1 min-h-[44px]"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-white/6 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
            style={{
              width: `${totalSets > 0 ? Math.round((completedCount / totalSets) * 100) : 0}%`,
            }}
          />
        </div>

        <h1 className="text-xl font-black text-text-primary tracking-tight mb-1">
          Sessão ativa
        </h1>
        <p className="text-xs text-text-tertiary">
          Foco. Intensidade. Progresso.
        </p>
        {estimatedDurationMs != null && (
          <p className="text-[11px] text-text-muted mt-1">
            Estimativa: ~{Math.round(estimatedDurationMs / 60000)} min
            {pastAvgDurationMs == null && " (baseado no nº de séries)"}
          </p>
        )}
      </div>

      {completedCount === 0 && exercises[0] && (
        <div className="px-4 mb-2">
          <div className="rounded-2xl bg-secondaryDim border border-secondary/25 px-4 py-3.5 flex items-center gap-3">
            <span className="text-xl shrink-0">🧘</span>
            <div>
              <p className="text-[13px] font-extrabold text-secondary">
                Aquecimento sugerido
              </p>
              <p className="text-xs mt-0.5 text-text-tertiary">
                {warmupSuggestion || getFallbackWarmup(exercises[0])}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-2">
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
            const isComplete =
              rows.length > 0 && completedSets === totalExerciseSets;
            const last = lastByExercise[exercise.id];
            const hasLast = last && last.weight != null && last.reps != null;

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
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {/* Equipment and machine/station number - Left Corner (#2 highlighted) */}
                          <div className="flex items-center gap-1 shrink-0">
                            {exercise.device && (
                              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-primary bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary/30">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                {exercise.device}
                              </span>
                            )}
                            {exercise.equipment && (
                              <span className="text-[12px] font-bold text-text-tertiary bg-surface3 px-2.5 py-0.5 rounded-full border border-border-subtle">
                                {getEquipmentAbbreviation(exercise.equipment)}
                              </span>
                            )}
                          </div>
                          {/* Exercise Name - (#1 highlighted) */}
                          <h3
                            className={`text-sm font-bold truncate ${
                              isComplete ? "text-primary" : "text-text-primary"
                            }`}
                          >
                            {exercise.name}
                          </h3>
                          {isComplete && (
                            <span className="text-[10px] font-semibold text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                              Concluído
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p
                            className={`text-[11px] ${
                              isComplete ? "text-primary" : "text-text-tertiary"
                            }`}
                          >
                            {completedSets}/{totalExerciseSets}{" "}
                            {pluralize(totalExerciseSets, "série", "séries")}
                          </p>
                          {hasLast && (
                            <span className="text-[11px] text-text-muted">
                              • Último:{" "}
                              <WeightDisplay kg={last.weight} inline /> ×{" "}
                              {last.reps}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isComplete && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center"
                          >
                            <svg
                              className="w-4 h-4"
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
                          className="w-9 h-9 rounded-full bg-white/6 flex items-center justify-center"
                        >
                          <svg
                            className="w-3 h-3 text-text-muted"
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

                  {!isComplete && progressionSuggestions[exercise.id] != null && (
                    <div className="px-3 pb-2 -mt-1 flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-secondary bg-secondaryDim px-2.5 py-1 rounded-full">
                        Sugestão:{" "}
                        <WeightDisplay
                          kg={progressionSuggestions[exercise.id]}
                          inline
                        />{" "}
                        (+
                        {(
                          progressionSuggestions[exercise.id] -
                          (Number(exercise.currentWeight) || 0)
                        )
                          .toFixed(1)
                          .replace(/\.0$/, "")}
                        kg)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          applyProgressionSuggestion(
                            exercise.id,
                            progressionSuggestions[exercise.id],
                          )
                        }
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}

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
                        <div className="p-2 space-y-1">
                          {exercise.gifUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setGifModal({
                                  url: exercise.gifUrl,
                                  name: exercise.name,
                                })
                              }
                              className="mx-2 mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-secondary bg-secondaryDim px-2.5 py-1 rounded-full"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Ver gif do exercício
                            </button>
                          )}
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
                                {/* Compact Set Row - Responsive */}
                                <div
                                  className={`flex flex-col gap-2 p-3 ${setActive ? "bg-gradient-to-r from-primary/5 to-transparent" : ""}`}
                                >
                                  {/* Main Row - Set Number, Check, Weight, Reps */}
                                  <div className="flex items-center gap-2 w-full">
                                    {/* Set Number & Check */}
                                    <div className="flex items-center gap-2 min-w-fit">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                        {setIndex + 1}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={row.completed}
                                        onClick={() =>
                                          updateSet(exercise.id, setIndex, {
                                            type: nextSetType(row.type),
                                          })
                                        }
                                        className={`h-6 min-w-[2.75rem] px-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wide transition-colors disabled:opacity-40 ${SET_TYPE_STYLES[row.type || "normal"]}`}
                                        aria-label="Tipo de série"
                                      >
                                        {SET_TYPE_LABELS[row.type || "normal"]}
                                      </button>
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
                                        className={`flex h-11 w-11 items-center justify-center rounded-[12px] border transition-all duration-200 ${
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
                                              initial={{
                                                scale: 0.3,
                                                opacity: 0,
                                              }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              exit={{ scale: 0.3, opacity: 0 }}
                                              transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 20,
                                              }}
                                              className="h-[12px] w-[12px]"
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
                                              initial={{
                                                scale: 0.5,
                                                opacity: 0,
                                              }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              exit={{ scale: 0.5, opacity: 0 }}
                                              transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 25,
                                              }}
                                              className="h-[10px] w-[10px] rounded-full bg-text-muted"
                                            />
                                          )}
                                        </AnimatePresence>
                                      </motion.button>
                                    </div>

                                    {/* Weight Stepper */}
                                    <div
                                      className={`${row.completed ? "opacity-40 pointer-events-none" : ""}`}
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

                                    {/* Reps Display and Label */}
                                    <div className="flex flex-col items-center gap-0">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={row.reps}
                                        disabled={row.completed}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                          const digits = e.target.value.replace(
                                            /[^0-9]/g,
                                            "",
                                          );
                                          updateSet(exercise.id, setIndex, {
                                            reps: digits === "" ? "" : Number(digits),
                                          });
                                        }}
                                        aria-label="Repetições"
                                        className={`h-11 w-11 rounded-lg bg-transparent text-center text-base font-bold tabular-nums outline-none focus:bg-surface2 ${
                                          row.completed
                                            ? "text-primary"
                                            : "text-text-primary"
                                        }`}
                                      />
                                      <span
                                        className={`text-[10px] font-medium leading-tight ${
                                          row.completed
                                            ? "text-primary"
                                            : "text-text-muted"
                                        }`}
                                      >
                                        reps
                                      </span>
                                    </div>
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

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          size="lg"
          variant={completedCount === totalSets ? "primary" : "secondary"}
          onClick={handleFinishWorkout}
          disabled={isFinishing}
        >
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
              className="bg-surface2 border border-border-subtle rounded-2xl p-5 max-w-sm w-full shadow-surface-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Finalizar treino incompleto?
              </h3>
              <p className="text-sm text-text-secondary mb-4 sm:mb-5">
                Você completou {completedExercises} de {totalExercises}{" "}
                exercícios. Deseja finalizar mesmo assim?
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

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-surface2 border border-border-subtle rounded-2xl p-5 max-w-sm w-full shadow-surface-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Sair e manter em andamento?
              </h3>
              <p className="text-sm text-text-secondary mb-4 sm:mb-5">
                Seu progresso fica salvo e você pode retomar depois pela tela
                inicial.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Continuar aqui
                </Button>
                <Button
                  size="md"
                  className="flex-1"
                  onClick={() => navigate(`/workout/${id}`)}
                >
                  Sair
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-surface2 border border-border-subtle rounded-2xl p-5 max-w-sm w-full shadow-surface-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Cancelar treino?
              </h3>
              <p className="text-sm text-text-secondary mb-4 sm:mb-5">
                Isso descarta o progresso desta sessão. Nenhum treino
                finalizado é afetado.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Continuar treino
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  className="flex-1"
                  onClick={handleCancelWorkout}
                >
                  Cancelar treino
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gifModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setGifModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setGifModal(null)}
                className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-surface2 border border-border-subtle flex items-center justify-center text-text-primary"
                aria-label="Fechar"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="bg-surface2 border border-border-subtle rounded-2xl p-4 shadow-surface-xl">
                <img
                  src={gifModal.url}
                  alt={gifModal.name}
                  className="w-full rounded-xl"
                />
                <p className="mt-3 text-sm font-bold text-text-primary text-center">
                  {gifModal.name}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutStart;
