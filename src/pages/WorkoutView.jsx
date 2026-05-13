import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExercises, getExerciseLogs } from "../services/firestore";
import Container from "../components/Container";
import Card from "../components/Card";
import Accordion from "../components/Accordion";
import { buttonPrimaryLinkClass, buttonGhostLinkClass } from "../components/Button";

const logTime = (log) =>
  log.date?.seconds != null ? log.date.seconds * 1000 : 0;

const WorkoutView = () => {
  const { id } = useParams();
  const [exercises, setExercises] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState({});
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

      <Link to={`/workout/${id}/start`} className={`${buttonPrimaryLinkClass} mb-8`}>
        Começar treino
      </Link>

      <div className="space-y-3">
        {exercises.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-zinc-500 text-sm">Nenhum exercício neste plano.</p>
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
                  {exerciseLogs[exercise.id]?.length > 0 ? (
                    exerciseLogs[exercise.id].map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between gap-3 text-sm text-zinc-400"
                      >
                        <span>
                          {logTime(log)
                            ? new Date(logTime(log)).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                        <span className="font-medium text-zinc-200 tabular-nums">
                          {log.weight != null ? `${log.weight} kg` : "—"}
                          {log.reps != null ? ` × ${log.reps}` : ""}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-sm">Sem registros ainda.</p>
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
