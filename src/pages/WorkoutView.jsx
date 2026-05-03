import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExercises, getExerciseLogs } from "../services/firestore";

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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link to="/" className="text-indigo-600 hover:text-indigo-500">
            ← Voltar ao Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Treino</h1>
          <div className="mt-6">
            <Link
              to={`/workout/${id}/start`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Começar Treino
            </Link>
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900">Exercícios</h2>
            <div className="mt-4 space-y-4">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-white shadow overflow-hidden sm:rounded-md"
                >
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {exercise.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Séries: {exercise.sets} | Repetições: {exercise.reps}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Peso atual: {exercise.currentWeight || "N/A"} kg
                    </p>
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-indigo-600">
                        Histórico de peso
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {exerciseLogs[exercise.id]?.map((log) => (
                          <li key={log.id} className="text-sm text-gray-500">
                            {new Date(
                              log.date.seconds * 1000,
                            ).toLocaleDateString()}
                            : {log.weight} kg
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutView;
