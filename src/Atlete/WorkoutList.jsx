import { doc, getDoc } from "firebase/firestore";
import { auth, database } from "../configuration";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { NavLink } from "react-router";

function WorkoutList() {
  const [workouts, setWorkouts] = useState([]);

  const getUserWorkouts = async (userId) => {
    const userRef = doc(database, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const workoutsIds = userData.assignedWorkouts;
      setWorkouts(workoutsIds);
    } else {
      console.log("fudeu");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("Usuário logado:", currentUser);
        getUserWorkouts(currentUser.uid);
      } else {
        console.log("Nenhum usuário logado");
      }
    });

    return () => unsubscribe(); // Cleanup para evitar vazamento de memória
  }, []);
  return (
    <div>
      <h1>workouts for the user</h1>
      <ul>
        {workouts.map((item, index) => (
          <li key={index}>
            <NavLink to={`/workout/${item}`}>{item}</NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default WorkoutList;
