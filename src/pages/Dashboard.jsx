import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getWorkouts, getWorkoutLogs } from "../services/firestore";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const workoutsData = await getWorkouts(user.uid);
        const logsData = await getWorkoutLogs(user.uid);
        setWorkouts(workoutsData);
        setWorkoutLogs(logsData);
        setLoading(false);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="mt-6">
            <Link
              to="/workouts"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Área de Treino
            </Link>
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900">Treino do Dia</h2>
            {workoutOfTheDay ? (
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <Link
                    to={`/workout/${workoutOfTheDay.id}`}
                    className="text-lg font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {workoutOfTheDay.name}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-gray-500">Nenhum treino disponível.</p>
            )}
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Todos os Treinos
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-5">
                    <Link
                      to={`/workout/${workout.id}`}
                      className="text-lg font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {workout.name}
                    </Link>
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

export default Dashboard;
