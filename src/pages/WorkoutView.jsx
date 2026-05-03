import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExercises, getExerciseLogs } from "../services/firestore";
import Container from "../components/Container";
import Button from "../components/Button";
import Card from "../components/Card";
import Accordion from "../components/Accordion";

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
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container title="Treino" subtitle="Lista de exercícios">
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            ← Voltar ao Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <Link to={`/workout/${id}/start`}>
          <Button size="lg">Começar Treino</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {exercises.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Nenhum exercício adicionado ainda</p>
          </Card>
        ) : (
          exercises.map((exercise) => (
            <Card key={exercise.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {exercise.name}
                  </h3>
                  <p className="text-gray-600">
                    {exercise.sets} séries x {exercise.reps} repetições
                  </p>
                  <p className="text-gray-600">
                    Peso atual: {exercise.currentWeight || "N/A"} kg
                  </p>
                </div>
              </div>
              <Accordion title="Histórico de peso">
                <div className="space-y-2">
                  {exerciseLogs[exercise.id]?.length > 0 ? (
                    exerciseLogs[exercise.id].map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>
                          {new Date(
                            log.date.seconds * 1000,
                          ).toLocaleDateString()}
                        </span>
                        <span>{log.weight} kg</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Nenhum histórico disponível
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
