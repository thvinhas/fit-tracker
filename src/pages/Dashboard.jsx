import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getWorkouts, getWorkoutLogs } from "../services/firestore";
import Container from "../components/Container";
import Button from "../components/Button";
import Card from "../components/Card";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const workoutsData = await getWorkouts(user.uid);
          const logsData = await getWorkoutLogs(user.uid);
          setWorkouts(workoutsData);
          setWorkoutLogs(logsData);
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  if (authLoading) return <div>Loading...</div>;

  const getWorkoutOfTheDay = () => {
    if (workouts.length === 0) return null;
    const completedWorkouts = workoutLogs.map((log) => log.workoutId);
    const nextWorkout = workouts.find(
      (workout) => !completedWorkouts.includes(workout.id),
    );
    return nextWorkout || workouts[0];
  };

  const workoutOfTheDay = getWorkoutOfTheDay();

  if (loading) {
    return (
      <Container title="Dashboard" subtitle="Carregando seus treinos...">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container title="Dashboard" subtitle="Bem-vindo ao seu espaço de treinos">
      {/* Action Buttons */}
      <div className="mb-8 flex gap-4">
        <Link to="/workouts" className="flex-1 sm:flex-none">
          <Button size="md">⚙️ Área de Treino</Button>
        </Link>
      </div>

      {/* Workout of the Day */}
      {workoutOfTheDay ? (
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Treino do Dia
          </h3>
          <Card highlighted className="p-6">
            <div className="space-y-6">
              <Link
                key={workoutOfTheDay.id}
                to={`/workout/${workoutOfTheDay.id}`}
              >
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                    Destaque
                  </span>
                  <h4 className="mt-4 text-2xl font-bold text-indigo-600">
                    {workoutOfTheDay.name}
                  </h4>
                  <p className="text-gray-600 mt-3">
                    Próximo treino na sequência
                  </p>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      ) : (
        <div className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-900 font-medium">
            ℹ️ Crie um treino para começar!
          </p>
        </div>
      )}

      {/* All Workouts */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">💪</span>
          Todos os Treinos
        </h3>
        {workouts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">Nenhum treino criado ainda</p>
            <Link to="/workouts">
              <Button>Criar seu primeiro treino</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workouts.map((workout) => (
              <Link key={workout.id} to={`/workout/${workout.id}`}>
                <Card className="p-6 h-full hover:shadow-lg cursor-pointer">
                  <h4 className="text-lg font-bold text-gray-900">
                    {workout.name}
                  </h4>
                  <p className="text-gray-500 text-sm mt-2">
                    {workoutLogs.some((log) => log.workoutId === workout.id)
                      ? "✅ Concluído"
                      : "⏳ Pendente"}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Dashboard;
