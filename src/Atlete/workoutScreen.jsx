import { doc, getDoc, updateDoc } from "firebase/firestore";
import { database } from "../configuration";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

function WorkoutScreen() {
  const [workout, setWorkout] = useState({});
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const { id } = useParams();

  const getUserWorkouts = async () => {
    const workoutRef = doc(database, "workouts", id);
    const workoutSnap = await getDoc(workoutRef);

    if (workoutSnap.exists()) {
      const workout = workoutSnap.data();
      setWorkout(workout);
    } else {
      console.log("fudeu");
    }
  };

  useEffect(() => {
    getUserWorkouts();
  }, []);

  const startWorkout = () => {
    setWorkoutStarted(true);
  };

  // Função para finalizar o treino
  const finishWorkout = async () => {
    const workoutRef = doc(database, "workouts", id);
    const atualizacoes = {};
    Object.keys(workout.exercises).forEach((exerciseId) => {
      console.log(exerciseId);
      atualizacoes[`exercises.${exerciseId}.weight`] =
        workout.exercises[exerciseId].weight;
    });
    console.log(atualizacoes);
    await updateDoc(workoutRef, atualizacoes);
    setWorkoutStarted(false);
  };
  const toggleDone = (index) => {
    const newWorkout = { ...workout, exercises: { ...workout.exercises } };

    // Pegar o exercício pelo index e alterar a propriedade `done`
    const exerciseKeys = Object.keys(newWorkout.exercises);
    const exerciseKey = exerciseKeys[index];

    if (exerciseKey) {
      newWorkout.exercises[exerciseKey].done =
        !newWorkout.exercises[exerciseKey].done;
      setWorkout(newWorkout);
    }
  };

  // Atualizar o peso do exercício
  const updateWeight = (index, newWeight) => {
    // Criar uma cópia profunda do workout
    const newWorkout = { ...workout, exercises: { ...workout.exercises } };

    // Pegar a chave do exercício pelo índice
    const exerciseKeys = Object.keys(newWorkout.exercises);
    const exerciseKey = exerciseKeys[index];

    if (exerciseKey) {
      newWorkout.exercises[exerciseKey].weight = Number(newWeight);
      setWorkout(newWorkout);
    }
  };

  return (
    <div className="container">
      <h1>{workout.name}</h1>
      <h2>Exercices:</h2>
      {!workoutStarted ? (
        <button onClick={startWorkout}>Começar o Treino</button>
      ) : (
        <button onClick={finishWorkout}>Finalizar Treino</button>
      )}
      <div className="workout-list">
        {workout.exercises ? (
          Object.values(workout.exercises).map((exercise, index) => (
            <div
              key={exercise.id}
              className={`exercise ${exercise.done ? "done" : ""}`}
            >
              {workoutStarted && (
                <input
                  type="checkbox"
                  checked={exercise.done || false}
                  onChange={() => toggleDone(index)}
                />
              )}
              <span>
                {exercise.name} - {exercise.reps} reps
              </span>
              {workoutStarted && (
                <input
                  type="number"
                  value={exercise.weight}
                  onChange={(e) => updateWeight(index, e.target.value)}
                />
              )}
              {workoutStarted && <span>kg</span>}
            </div>
          ))
        ) : (
          <p>Carregando exercícios...</p>
        )}
      </div>
    </div>
  );
}

export default WorkoutScreen;
