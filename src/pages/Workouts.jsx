import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getWorkouts, deleteWorkout } from "../services/firestore";
import toast from "react-hot-toast";
import Container from "../components/Container";
import Button from "../components/Button";
import Card from "../components/Card";

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

  if (authLoading) {
    return (
      <Container>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container title="Área de Treino" subtitle="Gerencie seus treinos">
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            ← Voltar ao Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <Link to="/workouts/new">
          <Button size="lg">Criar Novo Treino</Button>
        </Link>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Seus Treinos
        </h3>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : workouts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">Nenhum treino criado ainda</p>
            <Link to="/workouts/new">
              <Button>Criar seu primeiro treino</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workouts.map((workout) => (
              <Card key={workout.id} className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {workout.name}
                </h4>
                <div className="flex gap-2">
                  <Link to={`/workouts/${workout.id}/edit`} className="flex-1">
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Editar
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(workout.id)}
                    className="flex-1 !bg-red-500 !text-white"
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Workouts;
