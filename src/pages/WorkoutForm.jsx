import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  addWorkout,
  updateWorkout,
  deleteExercise,
  getWorkouts,
  addExercise,
  updateExercise,
  getExercises,
} from "../services/firestore";
import toast from "react-hot-toast";
import Container from "../components/Container";
import Button, { buttonGhostLinkClass } from "../components/Button";
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
  const originalExerciseIdsRef = useRef([]);

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
          originalExerciseIdsRef.current = exercisesData
            .map((exercise) => exercise.id)
            .filter(Boolean);
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

  const moveExercise = (index, direction) => {
    const nextExercises = [...exercises];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= nextExercises.length) return;
    [nextExercises[index], nextExercises[swapIndex]] = [
      nextExercises[swapIndex],
      nextExercises[index],
    ];
    setExercises(nextExercises);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const getDuplicateName = (workoutName) => {
    const match = workoutName.match(/^(.*?)\s+(\d+)$/);
    if (!match) {
      return `${workoutName} 2`;
    }
    const baseName = match[1];
    const currentNumber = Number(match[2]);
    return `${baseName} ${currentNumber + 1}`;
  };

  const handleDuplicate = async () => {
    try {
      setLoading(true);
      const duplicateName = getDuplicateName(name);
      const workoutRef = await addWorkout({
        name: duplicateName,
        userId: user.uid,
        order: Date.now(),
        createdAt: new Date(),
      });

      await Promise.all(
        exercises.map((exercise, index) =>
          addExercise({
            workoutId: workoutRef.id,
            name: exercise.name,
            device: exercise.device,
            sets: exercise.sets,
            reps: exercise.reps,
            currentWeight: exercise.currentWeight,
            order: index,
            createdAt: new Date(),
          }),
        ),
      );

      toast.success("Treino duplicado!");
      navigate("/workouts");
    } catch (error) {
      setLoading(false);
      toast.error("Erro: " + error.message);
    }
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

      if (isEdit) {
        const currentExerciseIds = exercises
          .map((exercise) => exercise.id)
          .filter(Boolean);

        const deletedExerciseIds = originalExerciseIdsRef.current.filter(
          (exerciseId) => !currentExerciseIds.includes(exerciseId),
        );

        await Promise.all(
          deletedExerciseIds.map((exerciseId) => deleteExercise(exerciseId)),
        );
      }

      // Handle exercises — `order` preserva a sequência do formulário (1º = primeiro no treino)
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        const { id: exerciseDocId, ...fields } = exercise;
        const payload = {
          ...fields,
          workoutId,
          order: i,
        };
        if (exerciseDocId) {
          await updateExercise(exerciseDocId, payload);
        } else {
          await addExercise({
            ...payload,
            createdAt: new Date(),
          });
        }
      }

      toast.success(isEdit ? "Treino atualizado!" : "Treino criado!");
      navigate("/workouts");
    } catch (error) {
      toast.error("Erro: " + error.message);
    }
  };

  if (authLoading) {
    return (
      <Container>
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container
      title={isEdit ? "Editar treino" : "Novo treino"}
      subtitle="Monte o plano; durante a sessão o registro é rápido."
    >
      <Link to="/workouts" className={`${buttonGhostLinkClass} mb-6`}>
        ← Voltar
      </Link>

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
          <h3 className="text-lg font-extrabold text-text-primary mb-4">
            Exercícios
          </h3>
          <div className="space-y-6">
            {exercises.map((exercise, index) => (
              <Card key={index} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Exercício {index + 1}
                    </p>
                  </div>
                  {exercises.length > 1 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => moveExercise(index, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => moveExercise(index, "down")}
                        disabled={index === exercises.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                  )}
                </div>
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

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isEdit && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleDuplicate}
            >
              Duplicar treino
            </Button>
          )}
          <Button type="submit" size="lg">
            {isEdit ? "Atualizar Treino" : "Criar Treino"}
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default WorkoutForm;
