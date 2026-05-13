import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getExercises,
  updateExercise,
  addWorkoutLog,
  addExerciseLog,
  getExerciseLogs,
} from "../services/firestore";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import Button, { buttonGhostLinkClass } from "../components/Button";

const REP_CHIPS = [6, 8, 10, 12, 15];

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const WeightStepper = ({ value, onChange, disabled }) => (
  <div className="flex items-center justify-center gap-3">
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(clamp(value - 1, 0, 500))}
      className="h-11 w-11 rounded-xl bg-white/10 border border-white/10 text-lg font-semibold text-zinc-100 hover:bg-white/15 active:scale-95 disabled:opacity-30 transition-transform"
      aria-label="Diminuir peso"
    >
      −
    </button>
    <div className="min-w-[5.5rem] text-center">
      <span className="text-xl font-bold tabular-nums text-zinc-50">{value}</span>
      <span className="text-sm font-medium text-zinc-500 ml-1">kg</span>
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(clamp(value + 1, 0, 500))}
      className="h-11 w-11 rounded-xl bg-white/10 border border-white/10 text-lg font-semibold text-zinc-100 hover:bg-white/15 active:scale-95 disabled:opacity-30 transition-transform"
      aria-label="Aumentar peso"
    >
      +
    </button>
  </div>
);

const RepChips = ({ value, onChange, disabled }) => (
  <div className="flex flex-wrap gap-1.5 justify-center">
    {REP_CHIPS.map((n) => {
      const active = value === n;
      return (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`min-w-[2.25rem] px-2 py-1.5 rounded-lg text-sm font-semibold tabular-nums transition-all ${
            active
              ? "bg-emerald-500 text-zinc-950 shadow-[0_0_16px_-4px_rgba(52,211,153,0.5)]"
              : "bg-zinc-800/80 text-zinc-300 border border-white/10 hover:border-white/20"
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
      setLoading(false);
    };
    load();
  }, [id]);

  const updateSet = useCallback((exerciseId, setIndex, patch) => {
    setSetStates((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((row, i) =>
        i === setIndex ? { ...row, ...patch } : row,
      ),
    }));
  }, []);

  const handleFinishWorkout = async () => {
    try {
      await addWorkoutLog({
        workoutId: id,
        userId: user.uid,
        date: new Date(),
      });

      for (const exercise of exercises) {
        const rows = setStates[exercise.id] || [];
        let lastWeight = Number(exercise.currentWeight) || 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row.completed) continue;
          const w = Number(row.weight) || 0;
          const r = Number(row.reps) || 0;
          lastWeight = w;
          await addExerciseLog({
            exerciseId: exercise.id,
            weight: w,
            reps: r,
            setIndex: i + 1,
            workoutId: id,
            date: new Date(),
          });
        }

        if (rows.some((r) => r.completed)) {
          await updateExercise(exercise.id, { currentWeight: lastWeight });
        }
      }

      toast.success("Treino concluído!");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error("Erro ao finalizar: " + error.message);
    }
  };

  const lastLabel = useCallback((exerciseId) => {
    const last = lastByExercise[exerciseId];
    if (!last) return null;
    const w = last.weight != null ? `${last.weight} kg` : null;
    const r = last.reps != null ? `${last.reps} reps` : null;
    if (w && r) return `${w} × ${r}`;
    if (w) return w;
    return null;
  }, [lastByExercise]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin"
          aria-hidden
        />
        <p className="text-sm text-zinc-500">Preparando treino…</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link to={`/workout/${id}`} className={buttonGhostLinkClass}>
          ← Voltar
        </Link>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            Progresso
          </p>
          <p className="text-sm font-bold text-emerald-400 tabular-nums">
            {completedCount}/{totalSets} séries
          </p>
        </div>
      </div>

      <h1 className="text-xl font-bold text-zinc-50 tracking-tight mb-6">
        Sessão ativa
      </h1>

      <div className="space-y-5">
        {exercises.length === 0 ? (
          <p className="text-center text-zinc-500 py-12 text-sm">
            Nenhum exercício neste treino.
          </p>
        ) : (
          exercises.map((exercise) => {
            const rows = setStates[exercise.id] || [];
            const device = exercise.device
              ? String(exercise.device).trim()
              : "";
            const subtitle = [
              device ? `Aparelho ${device}` : null,
              lastLabel(exercise.id) ? `Último: ${lastLabel(exercise.id)}` : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <section
                key={exercise.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
              >
                <div className="px-4 pt-4 pb-3 border-b border-white/10">
                  <h2 className="text-lg font-bold text-zinc-50 leading-snug">
                    {exercise.name}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-zinc-500 mt-1.5">{subtitle}</p>
                  )}
                </div>

                <div className="divide-y divide-white/10">
                  {rows.map((row, setIndex) => (
                    <div
                      key={setIndex}
                      className={`px-4 py-4 transition-colors ${
                        row.completed ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                          Set {setIndex + 1}
                        </span>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          onClick={() =>
                            updateSet(exercise.id, setIndex, {
                              completed: !row.completed,
                            })
                          }
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                            row.completed
                              ? "border-emerald-400 bg-emerald-500 text-zinc-950"
                              : "border-white/20 text-zinc-500 hover:border-emerald-500/50 hover:text-emerald-400"
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
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </motion.svg>
                            ) : (
                              <motion.span
                                key="dot"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="h-2 w-2 rounded-full bg-zinc-500 block"
                              />
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>

                      <div
                        className={`space-y-3 ${row.completed ? "opacity-45 pointer-events-none" : ""}`}
                      >
                        <WeightStepper
                          value={Number(row.weight) || 0}
                          onChange={(w) =>
                            updateSet(exercise.id, setIndex, { weight: w })
                          }
                          disabled={row.completed}
                        />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2 text-center">
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
              </section>
            );
          })
        )}
      </div>

      <div className="mt-8 sticky bottom-4 z-10">
        <Button size="lg" onClick={handleFinishWorkout}>
          Finalizar treino
        </Button>
      </div>
    </div>
  );
};

export default WorkoutStart;
