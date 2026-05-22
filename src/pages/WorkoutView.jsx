import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getExercises,
  getExerciseLogs,
  getSessions,
} from "../services/firestore";
import Container from "../components/Container";
import Card from "../components/Card";
import Accordion from "../components/Accordion";
import {
  buttonPrimaryLinkClass,
  buttonGhostLinkClass,
} from "../components/Button";
import { useOfflineStorage } from "../hooks/useOfflineStorage";

const logTime = (log) =>
  log.date?.seconds != null ? log.date.seconds * 1000 : 0;

const WorkoutView = () => {
  const { id } = useParams();
  const [exercises, setExercises] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { saveWorkout, getWorkout, isOnline, getExercisesWithCache } =
    useOfflineStorage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to get from offline storage first
        const offlineWorkout = await getWorkout(id);

        const exercisesData = await getExercisesWithCache(id);
        const logsPromises = exercisesData.map(async (exercise) => {
          const logs = await getExerciseLogs(exercise.id);
          return { exerciseId: exercise.id, logs };
        });
        const logsData = await Promise.all(logsPromises);
        const logsMap = {};
        logsData.forEach(({ exerciseId, logs }) => {
          logsMap[exerciseId] = logs;
        });
        setExercises(exercisesData);
        setExerciseLogs(logsMap);

        // Save to offline storage
        await saveWorkout({ id, exercises: exercisesData });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching workout data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [id, saveWorkout, getWorkout, getExercisesWithCache]);

  const groupedHistoryByExercise = useMemo(() => {
    const grouped = {};
    exercises.forEach((exercise) => {
      const logs = exerciseLogs[exercise.id] || [];
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
        .sort((a, b) => logTime(b) - logTime(a));

      // Filter to show only meaningful progressions
      const filteredSessions = [];
      const sortedByOldest = [...sessionsArray].sort(
        (a, b) => logTime(a) - logTime(b),
      );

      let maxWeightSeen = 0;
      let maxRepsAtMaxWeight = 0;

      sortedByOldest.forEach((session) => {
        const weight = session.bestWeight || 0;
        const reps = session.bestReps || 0;

        // Always include the first session (baseline)
        if (filteredSessions.length === 0) {
          filteredSessions.push(session);
          maxWeightSeen = weight;
          maxRepsAtMaxWeight = reps;
          return;
        }

        // Include if weight increased
        if (weight > maxWeightSeen) {
          filteredSessions.push(session);
          maxWeightSeen = weight;
          maxRepsAtMaxWeight = reps;
          return;
        }

        // Include if same weight but reps increased
        if (weight === maxWeightSeen && reps > maxRepsAtMaxWeight) {
          filteredSessions.push(session);
          maxRepsAtMaxWeight = reps;
          return;
        }

        // Include if it's a PR in reps at a lower weight (meaningful progression)
        const previousBestReps = Math.max(
          ...filteredSessions.map((s) => s.bestReps || 0),
        );
        if (reps > previousBestReps && weight >= maxWeightSeen * 0.9) {
          filteredSessions.push(session);
          return;
        }
      });

      // Sort back to newest first for display
      grouped[exercise.id] = filteredSessions.sort(
        (a, b) => logTime(b) - logTime(a),
      );
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
    <Container title="Plano" subtitle="Revisão rápida antes da sessão.">
      <Link
        to="/workouts"
        className={`${buttonGhostLinkClass} mb-6 touch-feedback min-h-[44px] flex items-center`}
      >
        ← Treinos
      </Link>

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

      <div className="space-y-3 smooth-scroll">
        {exercises.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-muted text-sm">
              Nenhum exercício neste plano.
            </p>
          </Card>
        ) : (
          exercises.map((exercise, index) => (
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
                <div className="mb-3">
                  <h3 className="text-base font-bold text-text-primary">
                    {exercise.name}
                  </h3>
                  <p className="text-xs text-text-tertiary mt-1">
                    {exercise.sets} séries × {exercise.reps} reps · meta{" "}
                    {exercise.currentWeight || "—"} kg
                  </p>
                </div>
                <Accordion title="Histórico">
                  <div className="space-y-2">
                    {groupedHistoryByExercise[exercise.id]?.length > 0 ? (
                      groupedHistoryByExercise[exercise.id].map((session) => {
                        const prevSession =
                          groupedHistoryByExercise[exercise.id][
                            groupedHistoryByExercise[exercise.id].indexOf(
                              session,
                            ) + 1
                          ];
                        const isPR =
                          !prevSession ||
                          (session.bestWeight || 0) >
                            (prevSession.bestWeight || 0) ||
                          ((session.bestWeight || 0) ===
                            (prevSession.bestWeight || 0) &&
                            (session.bestReps || 0) >
                              (prevSession.bestReps || 0));

                        return (
                          <div
                            key={session.sessionId}
                            className="flex justify-between gap-3 text-sm text-text-tertiary py-2"
                          >
                            <span>
                              {logTime(session)
                                ? new Date(logTime(session)).toLocaleDateString(
                                    "pt-BR",
                                    { day: "2-digit", month: "short" },
                                  )
                                : "—"}
                            </span>
                            <span className="font-bold text-text-secondary tabular-nums">
                              {session.bestWeight != null
                                ? `${session.bestWeight} kg`
                                : "—"}{" "}
                              × {session.bestReps || "—"}
                              {isPR && (
                                <span className="ml-2 text-accent">🔥</span>
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
          ))
        )}
      </div>
    </Container>
  );
};

export default WorkoutView;
