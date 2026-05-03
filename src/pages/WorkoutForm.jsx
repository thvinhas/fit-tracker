import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  addWorkout,
  updateWorkout,
  getWorkouts,
  addExercise,
  updateExercise,
  getExercises,
  deleteExercise,
} from "../services/firestore";
import toast from "react-hot-toast";
import Container from "../components/Container";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";

const WorkoutForm = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState([
    { name: "", device: "", sets: "", reps: "", currentWeight: "" },
  ]);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && user) {
      const fetchData = async () => {
        const workouts = await getWorkouts(user.uid);
        const workout = workouts.find((w) => w.id === id);
        if (workout) {
          setName(workout.name);
          const exercisesData = await getExercises(id);
          setExercises(
            exercisesData.length > 0
              ? exercisesData
              : [
                  {
                    name: "",
                    device: "",
                    sets: "",
                    reps: "",
                    currentWeight: "",
                  },
                ],
          );
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [id, user, isEdit]);

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { name: "", device: "", sets: "", reps: "", currentWeight: "" },
    ]);
  };

  const handleExerciseChange = (index, field, value) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let workoutId = id;
      if (isEdit) {
        await updateWorkout(id, { name });
      } else {
        const workoutRef = await addWorkout({
          name,
          userId: user.uid,
          order: Date.now(), // Simple order
          createdAt: new Date(),
        });
        workoutId = workoutRef.id;
      }

      // Handle exercises
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        if (exercise.id) {
          await updateExercise(exercise.id, exercise);
        } else {
          await addExercise({ ...exercise, workoutId });
        }
      }

      toast.success(isEdit ? "Treino atualizado!" : "Treino criado!");
      navigate("/workouts");
    } catch (error) {
      toast.error("Erro: " + error.message);
    }
  };

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
    <Container
      title={isEdit ? "Editar Treino" : "Criar Treino"}
      subtitle="Configure os exercícios do seu treino"
    >
      <div className="mb-6">
        <Link to="/workouts">
          <Button variant="ghost" size="sm">
            ← Voltar
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <Input
            label="Nome do Treino"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex: Treino de Peito"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Exercícios
          </h3>
          <div className="space-y-6">
            {exercises.map((exercise, index) => (
              <Card key={index} className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Nome do exercício"
                    type="text"
                    value={exercise.name}
                    onChange={(e) =>
                      handleExerciseChange(index, "name", e.target.value)
                    }
                    required
                    placeholder="Ex: Supino Reto"
                  />
                  <Input
                    label="Aparelho (opcional)"
                    type="text"
                    value={exercise.device}
                    onChange={(e) =>
                      handleExerciseChange(index, "device", e.target.value)
                    }
                    placeholder="Ex: 1"
                  />
                  <Input
                    label="Séries"
                    type="number"
                    value={exercise.sets}
                    onChange={(e) =>
                      handleExerciseChange(index, "sets", e.target.value)
                    }
                    required
                    placeholder="Ex: 4"
                  />
                  <Input
                    label="Repetições"
                    type="number"
                    value={exercise.reps}
                    onChange={(e) =>
                      handleExerciseChange(index, "reps", e.target.value)
                    }
                    required
                    placeholder="Ex: 10"
                  />
                  <Input
                    label="Peso inicial (kg)"
                    type="number"
                    value={exercise.currentWeight}
                    onChange={(e) =>
                      handleExerciseChange(
                        index,
                        "currentWeight",
                        e.target.value,
                      )
                    }
                    placeholder="Ex: 80"
                  />
                </div>
                {exercises.length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveExercise(index)}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddExercise}
            >
              Adicionar Exercício
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            {isEdit ? "Atualizar Treino" : "Criar Treino"}
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default WorkoutForm;
