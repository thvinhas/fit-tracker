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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            to="/workouts"
            className="text-indigo-600 hover:text-indigo-500"
          >
            ← Voltar
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {isEdit ? "Editar Treino" : "Criar Treino"}
          </h1>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nome do Treino
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Exercícios</h2>
              {exercises.map((exercise, index) => (
                <div
                  key={index}
                  className="mt-4 p-4 border border-gray-200 rounded-md"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Nome do exercício"
                      value={exercise.name}
                      onChange={(e) =>
                        handleExerciseChange(index, "name", e.target.value)
                      }
                      required
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Número do aparelho (opcional)"
                      value={exercise.device}
                      onChange={(e) =>
                        handleExerciseChange(index, "device", e.target.value)
                      }
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Séries"
                      value={exercise.sets}
                      onChange={(e) =>
                        handleExerciseChange(index, "sets", e.target.value)
                      }
                      required
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Repetições"
                      value={exercise.reps}
                      onChange={(e) =>
                        handleExerciseChange(index, "reps", e.target.value)
                      }
                      required
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Peso inicial (opcional)"
                      value={exercise.currentWeight}
                      onChange={(e) =>
                        handleExerciseChange(
                          index,
                          "currentWeight",
                          e.target.value,
                        )
                      }
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(index)}
                      className="mt-2 text-red-600 hover:text-red-500"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddExercise}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Adicionar Exercício
              </button>
            </div>
            <div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {isEdit ? "Atualizar Treino" : "Criar Treino"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkoutForm;
