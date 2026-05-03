import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getWorkouts, deleteWorkout } from "../services/firestore";
import toast from "react-hot-toast";

const Workouts = () => {
  const { user, loading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchWorkouts = async () => {
        const workoutsData = await getWorkouts(user.uid);
        setWorkouts(workoutsData);
        setLoading(false);
      };
      fetchWorkouts();
    }
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await deleteWorkout(id);
      setWorkouts(workouts.filter((workout) => workout.id !== id));
      toast.success("Treino excluído!");
    } catch (error) {
      toast.error("Erro ao excluir treino: " + error.message);
    }
  };

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link to="/" className="text-indigo-600 hover:text-indigo-500">
            ← Voltar ao Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Área de Treino
          </h1>
          <div className="mt-6">
            <Link
              to="/workouts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Criar Treino
            </Link>
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900">Seus Treinos</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-gray-900">
                      {workout.name}
                    </h3>
                    <div className="mt-4 flex space-x-2">
                      <Link
                        to={`/workouts/${workout.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(workout.id)}
                        className="text-red-600 hover:text-red-500"
                      >
                        Excluir
                      </button>
                    </div>
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

export default Workouts;
