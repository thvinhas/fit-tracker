import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getWorkout,
  getExercises,
  getExerciseLogs,
  getLastPerformance,
  getProgram,
} from "../services/firestore";
import Container from "../components/Container";
import Card from "../components/Card";
import Accordion from "../components/Accordion";
import Sparkline from "../components/Sparkline";
import {
  buttonPrimaryLinkClass,
  buttonGhostLinkClass,
} from "../components/Button";
import { getLogTimestampMs } from "../utils/dateHelpers";
import WeightDisplay from "../components/WeightDisplay";

const isPRSession = (sortedSessions, index) => {
  const session = sortedSessions[index];
  if (!session) return false;
  const prev = sortedSessions[index + 1];
  if (!prev) return false;
  return (
    (session.bestWeight || 0) > (prev.bestWeight || 0) ||
    ((session.bestWeight || 0) === (prev.bestWeight || 0) &&
      (session.bestReps || 0) > (prev.bestReps || 0))
  );
};

const WorkoutView = () => {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [lastPerformanceByExercise, setLastPerformanceByExercise] = useState(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workoutData, exercisesData] = await Promise.all([
          getWorkout(id),
          getExercises(id),
        ]);
        setWorkout(workoutData);
        if (workoutData?.programId) {
          const programData = await getProgram(workoutData.programId);
          setProgram(programData);
        }
        const logsPromises = exercisesData.map(async (exercise) => {
          const logs = await getExerciseLogs(exercise.id);
          return { exerciseId: exercise.id, logs };
        });
        const [logsData, lastPerformanceData] = await Promise.all([
          Promise.all(logsPromises),
          Promise.all(
            exercisesData.map((exercise) => getLastPerformance(exercise.id)),
          ),
        ]);
        const logsMap = {};
        logsData.forEach(({ exerciseId, logs }) => {
          logsMap[exerciseId] = logs;
        });
        const lastPerformanceMap = {};
        exercisesData.forEach((exercise, index) => {
          lastPerformanceMap[exercise.id] = lastPerformanceData[index];
        });
        setExercises(exercisesData);
        setExerciseLogs(logsMap);
        setLastPerformanceByExercise(lastPerformanceMap);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching workout data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const groupedHistoryByExercise = useMemo(() => {
    const grouped = {};
    exercises.forEach((exercise) => {
      const logs = (exerciseLogs[exercise.id] || []).filter(
        (log) => log.type !== "warmup",
      );
      const sessionGroups = {};

      logs.forEach((log) => {
        const sessionId = log.sessionId || log.id;
        if (!sessionGroups[sessionId]) {
          sessionGroups[sessionId] = {
            sessionId,
            date: log.date,
            sets: [],
          };
        }
        sessionGroups[sessionId].sets.push(log);
      });

      const sessionsArray = Object.values(sessionGroups)
        .map((session) => {
          const bestSet = session.sets.reduce((best, current) => {
            const currentVolume = (current.weight || 0) * (current.reps || 0);
            const bestVolume = (best.weight || 0) * (best.reps || 0);
            return currentVolume > bestVolume ? current : best;
          }, session.sets[0]);

          return {
            sessionId: session.sessionId,
            date: session.date,
            bestWeight: bestSet.weight,
            bestReps: bestSet.reps,
            setCount: session.sets.length,
          };
        })
        .sort((a, b) => getLogTimestampMs(b) - getLogTimestampMs(a));

      grouped[exercise.id] = sessionsArray;
    });
    return grouped;
  }, [exercises, exerciseLogs]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container
      title={workout?.name || "Plano"}
      subtitle={
        program?.status === "archived"
          ? "Programa arquivado · só consulta"
          : "Revisão rápida antes da sessão."
      }
    >
      <Link
        to="/workouts"
        className={`${buttonGhostLinkClass} mb-6 touch-feedback min-h-[44px] flex items-center`}
      >
        ← Treinos
      </Link>

      {program?.status !== "archived" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="gpu-accelerated"
        >
          <Link
            to={`/workout/${id}/start`}
            className={`${buttonPrimaryLinkClass} mb-8 touch-feedback min-h-[48px] flex items-center justify-center`}
          >
            Começar treino
          </Link>
        </motion.div>
      )}

      <div className="space-y-3 smooth-scroll">
        {exercises.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-muted text-sm">
              Nenhum exercício neste plano.
            </p>
          </Card>
        ) : (
          exercises.map((exercise, index) => {
            const history = groupedHistoryByExercise[exercise.id] || [];
            const lastPerformance = lastPerformanceByExercise[exercise.id];
            const hasPR = history.length > 0 && isPRSession(history, 0);
            const sparkValues = history
              .slice(0, 5)
              .map((s) => s.bestWeight || 0)
              .reverse();

            const goalWeight = Number(exercise.currentWeight) || 0;
            const estimated1RM =
              lastPerformance?.weight != null
                ? Number(lastPerformance.weight) *
                  (1 + (Number(lastPerformance.reps) || 0) / 30)
                : null;
            const goalProgress =
              goalWeight > 0 && estimated1RM != null
                ? Math.min(100, Math.round((estimated1RM / goalWeight) * 100))
                : null;

            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                className="gpu-accelerated"
              >
                <Card className="p-4 touch-feedback">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {exercise.name}
                      </h3>
                      <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1 flex-wrap">
                        {exercise.sets} séries × {exercise.reps} reps · meta{" "}
                        {exercise.currentWeight ? (
                          <WeightDisplay kg={exercise.currentWeight} inline />
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    {hasPR && (
                      <span className="shrink-0 text-[11px] font-extrabold text-secondary bg-secondaryDim px-2.5 py-1 rounded-full">
                        PR
                      </span>
                    )}
                  </div>
                  {sparkValues.length > 1 && (
                    <div className="mb-2">
                      <Sparkline values={sparkValues} active={hasPR} />
                    </div>
                  )}
                  {lastPerformance && (
                    <p className="text-xs text-text-tertiary mb-3 flex items-center gap-1">
                      Último:{" "}
                      {lastPerformance.weight != null ? (
                        <WeightDisplay kg={lastPerformance.weight} inline />
                      ) : (
                        "—"
                      )}{" "}
                      × {lastPerformance.reps || "—"}
                    </p>
                  )}
                  {goalProgress != null && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-text-muted mb-1.5">
                        <span>
                          Meta de carga · 1RM est.{" "}
                          <span className="text-text-primary">
                            {Math.round(estimated1RM)}kg
                          </span>
                        </span>
                        <span className="text-text-primary tabular-nums">
                          {goalProgress}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${goalProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <Accordion title="Histórico">
                  <div className="space-y-2">
                    {history.length > 0 ? (
                      history.map((session, sessionIndex) => {
                        const isPR = isPRSession(history, sessionIndex);

                        return (
                          <div
                            key={session.sessionId}
                            className="flex justify-between gap-3 text-sm text-text-tertiary py-2"
                          >
                            <span>
                              {getLogTimestampMs(session)
                                ? new Date(
                                    getLogTimestampMs(session),
                                  ).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "—"}
                            </span>
                            <span className="font-bold text-text-secondary tabular-nums flex items-center gap-1">
                              {session.bestWeight != null ? (
                                <WeightDisplay kg={session.bestWeight} inline />
                              ) : (
                                "—"
                              )}{" "}
                              × {session.bestReps || "—"}
                              {isPR && (
                                <span className="ml-2 text-secondary">🔥</span>
                              )}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-text-muted text-sm">
                        Sem registros ainda.
                      </p>
                    )}
                  </div>
                </Accordion>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </Container>
  );
};

export default WorkoutView;
