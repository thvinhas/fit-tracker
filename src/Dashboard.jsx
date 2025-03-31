import { useEffect, useState } from "react";
import { auth, database } from "./configuration";
import { doc } from "firebase/firestore";
import WorkoutList from "./Atlete/WorkoutList";

function Dashboard() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userRef = doc(database, "users".user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserRole(userSnap.data().role);
        } else {
          console.error("Usuario Nao encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar role:", error);
      }
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) return <p>Carregando...</p>;
  return userRole === "coach" ? <CoachDashboard /> : <WorkoutList />;
}

export default Dashboard;
