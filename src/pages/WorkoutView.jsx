import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
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

const logTime = (log) =>
  log.date?.seconds != null ? log.date.seconds * 1000 : 0;

const WorkoutView = () => {
  const { id } = useParams();
  const [exercises, setExercises] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const exercisesData = await getExercises(id);
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
      setLoading(false);
    };
    fetchData();
  }, [id]);

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

      grouped[exercise.id] = sessionsArray.slice(0, 10);
    });
    return grouped;
  }, [exercises, exerciseLogs]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container title="Plano" subtitle="Revisão rápida antes da sessão.">
      <Link to="/workouts" className={`${buttonGhostLinkClass} mb-6`}>
        ← Treinos
      </Link>

      <Link
        to={`/workout/${id}/start`}
        className={`${buttonPrimaryLinkClass} mb-8`}
      >
        Começar treino
      </Link>

      <div className="space-y-3">
        {exercises.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-zinc-500 text-sm">
              Nenhum exercício neste plano.
            </p>
          </Card>
        ) : (
          exercises.map((exercise) => (
            <Card key={exercise.id} className="p-4">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-zinc-50">
                  {exercise.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
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
                          className="flex justify-between gap-3 text-sm text-zinc-400"
                        >
                          <span>
                            {logTime(session)
                              ? new Date(logTime(session)).toLocaleDateString(
                                  "pt-BR",
                                  { day: "2-digit", month: "short" },
                                )
                              : "—"}
                          </span>
                          <span className="font-medium text-zinc-200 tabular-nums">
                            {session.bestWeight != null
                              ? `${session.bestWeight} kg`
                              : "—"}{" "}
                            × {session.bestReps || "—"}
                            {isPR && (
                              <span className="ml-2 text-amber-400">🔥</span>
                            )}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-zinc-500 text-sm">
                      Sem registros ainda.
                    </p>
                  )}
                </div>
              </Accordion>
            </Card>
          ))
        )}
      </div>
    </Container>
  );
};

export default WorkoutView;
