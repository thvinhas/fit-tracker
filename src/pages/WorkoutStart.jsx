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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Executar Treino</h1>
          <div className="mt-8 space-y-4">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`bg-white shadow overflow-hidden sm:rounded-md ${completed[exercise.id] ? "opacity-50" : ""}`}
              >
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {exercise.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Séries: {exercise.sets} | Repetições: {exercise.reps}
                  </p>
                  <div className="mt-4 flex items-center space-x-4">
                    <input
                      type="number"
                      placeholder="Peso (kg)"
                      value={weights[exercise.id]}
                      onChange={(e) =>
                        handleWeightChange(exercise.id, e.target.value)
                      }
                      className="border border-gray-300 rounded-md px-3 py-2"
                      disabled={completed[exercise.id]}
                    />
                    <button
                      onClick={() => handleComplete(exercise.id)}
                      className={`px-4 py-2 rounded-md text-white ${completed[exercise.id] ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"}`}
                    >
                      {completed[exercise.id]
                        ? "Concluído"
                        : "Marcar como Concluído"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <button
              onClick={handleFinishWorkout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Finalizar Treino
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutStart;
