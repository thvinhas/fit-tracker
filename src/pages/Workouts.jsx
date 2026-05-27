import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { deleteWorkout, getWorkouts } from "../services/firestore";
import toast from "react-hot-toast";
import Container from "../components/Container";
import Card from "../components/Card";
import Button, {
  buttonPrimaryLinkClass,
  buttonSecondaryLinkClass,
} from "../components/Button";

const Workouts = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [workouts, setWorkouts] = useState([]);
  const [draftWorkouts, setDraftWorkouts] = useState([]);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchWorkouts = async () => {
      const workoutsData = await getWorkouts(user.uid);
      setWorkouts(workoutsData);
      setLoading(false);
    };
    fetchWorkouts();
  }, [user, location]);

  const startReorder = () => {
    setDraftWorkouts([...workouts]);
    setIsReorderMode(true);
  };

  const cancelReorder = () => {
    setIsReorderMode(false);
  };

  const moveWorkout = (index, direction) => {
    const next = [...draftWorkouts];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setDraftWorkouts(next);
  };

  const saveReorder = async () => {
    try {
      await Promise.all(
        draftWorkouts.map((workout, index) =>
          updateWorkout(workout.id, { order: index }),
        ),
      );
      setWorkouts(
        draftWorkouts.map((workout, index) => ({
          ...workout,
          order: index,
        })),
      );
      setIsReorderMode(false);
      toast.success("Ordem dos treinos atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar ordem: " + error.message);
    }
  };

  const handleDelete = async (workoutId) => {
    if (
      !window.confirm("Excluir este treino? Esta ação não pode ser desfeita.")
    ) {
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
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-text-muted font-medium">Carregando…</p>
      </div>
    );
  }

  return (
    <Container title="Treinos" subtitle="Planos e edição rápida.">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
          <Link to="/workouts/new" className={`${buttonPrimaryLinkClass}`}>
            Novo treino
          </Link>
          <div className="flex flex-wrap gap-2">
            {isReorderMode ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={cancelReorder}
                >
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={saveReorder}>
                  Salvar ordem
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={startReorder}
              >
                Organizar treinos
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
      >
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">
          Biblioteca
        </h3>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : workouts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <Card className="p-8 text-center">
            <p className="text-text-muted text-sm mb-4">Nenhum treino ainda.</p>
            <Link to="/workouts/new" className={buttonPrimaryLinkClass}>
              Criar treino
            </Link>
          </Card>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-2">
          {(isReorderMode ? draftWorkouts : workouts).map((workout, index) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2 + index * 0.05,
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
            >
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      {workout.name}
                    </h4>
                    <p className="text-sm text-text-muted">Ordem {index + 1}</p>
                  </div>
                  {isReorderMode && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => moveWorkout(index, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => moveWorkout(index, "down")}
                        disabled={
                          index ===
                          (isReorderMode
                            ? draftWorkouts.length
                            : workouts.length) -
                            1
                        }
                      >
                        ↓
                      </Button>
                    </div>
                  )}
                </div>
                {!isReorderMode && (
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
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </Container>
  );
};

export default Workouts;
