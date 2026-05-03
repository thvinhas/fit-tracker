import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getExercises,
  updateExercise,
  addWorkoutLog,
  addExerciseLog,
} from "../services/firestore";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import Container from "../components/Container";
import Button from "../components/Button";
import Input from "../components/Input";
import Checkbox from "../components/Checkbox";

const WorkoutStart = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [weights, setWeights] = useState({});
  const [completed, setCompleted] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      const exercisesData = await getExercises(id);
      setExercises(exercisesData);
      const initialWeights = {};
      const initialCompleted = {};
      exercisesData.forEach((exercise) => {
        initialWeights[exercise.id] = exercise.currentWeight || "";
        initialCompleted[exercise.id] = false;
      });
      setWeights(initialWeights);
      setCompleted(initialCompleted);
      setLoading(false);
    };
    fetchExercises();
  }, [id]);

  const handleWeightChange = (exerciseId, weight) => {
    setWeights({ ...weights, [exerciseId]: weight });
  };

  const handleComplete = (exerciseId) => {
    setCompleted({ ...completed, [exerciseId]: !completed[exerciseId] });
  };

  const handleFinishWorkout = async () => {
    try {
      // Add workout log
      await addWorkoutLog({
        workoutId: id,
        userId: user.uid,
        date: new Date(),
      });

      // Update exercises and add logs
      for (const exercise of exercises) {
        if (weights[exercise.id]) {
          await updateExercise(exercise.id, {
            currentWeight: weights[exercise.id],
          });
          await addExerciseLog({
            exerciseId: exercise.id,

            weight: weights[exercise.id],
            date: new Date(),
          });
        }
      }

      toast.success("Treino finalizado!");
      navigate("/");
    } catch (error) {
      toast.error("Erro ao finalizar treino: " + error.message);
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
      title="Executar Treino"
      subtitle="Marque os exercícios conforme avança"
    >
      <div className="space-y-6">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className={`p-6 rounded-xl border-2 transition-all duration-200 ${
              completed[exercise.id]
                ? "bg-gray-50 border-gray-200 opacity-60"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold ${
                    completed[exercise.id] ? "text-gray-500" : "text-gray-900"
                  }`}
                >
                  {exercise.name}
                </h3>
                <p
                  className={`text-sm ${
                    completed[exercise.id] ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {exercise.sets} séries x {exercise.reps} repetições
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <Input
                  label="Peso (kg)"
                  type="number"
                  value={weights[exercise.id]}
                  onChange={(e) =>
                    handleWeightChange(exercise.id, e.target.value)
                  }
                  disabled={completed[exercise.id]}
                  placeholder="Ex: 80"
                />
              </div>
              <div className="flex items-center">
                <Checkbox
                  label="Concluído"
                  checked={completed[exercise.id]}
                  onChange={() => handleComplete(exercise.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={handleFinishWorkout}>
          Finalizar Treino
        </Button>
      </div>
    </Container>
  );
};

export default WorkoutStart;
