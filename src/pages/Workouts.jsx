import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getWorkouts, deleteWorkout } from "../services/firestore";
import toast from "react-hot-toast";
import Container from "../components/Container";
import Card from "../components/Card";
import Button, {
  buttonPrimaryLinkClass,
  buttonSecondaryLinkClass,
} from "../components/Button";

const Workouts = () => {
  const { user, loading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchWorkouts = async () => {
      const workoutsData = await getWorkouts(user.uid);
      setWorkouts(workoutsData);
      setLoading(false);
    };
    fetchWorkouts();
  }, [user]);

  const handleDelete = async (workoutId) => {
    if (!window.confirm("Excluir este treino? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      await deleteWorkout(workoutId);
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      toast.success("Treino excluído.");
    } catch (error) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        <p className="text-sm text-zinc-500">Carregando…</p>
      </div>
    );
  }

  return (
    <Container title="Treinos" subtitle="Planos e edição rápida.">
      <Link to="/workouts/new" className={`${buttonPrimaryLinkClass} mb-8`}>
        Novo treino
      </Link>

      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">
        Biblioteca
      </h3>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        </div>
      ) : workouts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-zinc-500 text-sm mb-4">Nenhum treino ainda.</p>
          <Link to="/workouts/new" className={buttonPrimaryLinkClass}>
            Criar treino
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((workout) => (
            <Card key={workout.id} className="p-4">
              <h4 className="text-base font-semibold text-zinc-100 mb-4">
                {workout.name}
              </h4>
              <div className="flex gap-2">
                <Link
                  to={`/workout/${workout.id}`}
                  className={`${buttonSecondaryLinkClass} flex-1`}
                >
                  Abrir
                </Link>
                <Link
                  to={`/workouts/${workout.id}/edit`}
                  className={`${buttonSecondaryLinkClass} flex-1`}
                >
                  Editar
                </Link>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="flex-1 !px-2"
                  onClick={() => handleDelete(workout.id)}
                >
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default Workouts;
