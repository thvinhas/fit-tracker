import { doc, getDoc } from "firebase/firestore";
import { auth, database } from "../configuration";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { NavLink } from "react-router";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

function WorkoutList() {
  const [workouts, setWorkouts] = useState([]);

  const getUserWorkouts = async (userId) => {
    const userRef = doc(database, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const assignedWorkouts = userData.assignedWorkouts;
      // console.log(workoutsIds);
      const workoutsArray = Object.entries(assignedWorkouts).map(
        ([id, info]) => ({
          id,
          ...info,
        })
      );
      setWorkouts(workoutsArray);
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
    // <div>
    //   <h1>workouts for the user</h1>
    //   <ul>
    //     {workouts.map((item, index) => (
    //       <li key={index}>
    //
    //       </li>
    //     ))}
    //   </ul>
    // </div>

    <Box sx={{ p: 2, maxWidth: 500, mx: "auto" }}>
      <Stack direction={"row"} alignItems={"center"} spacing={1} mb={2}>
        <IconButton>{/* <ArrowBackIcon /> */}</IconButton>
        <Typography variant="h6" fontWeight={"bold"}>
          workouts for the user
        </Typography>
      </Stack>
      {workouts.map((workout) => (
        <Card elevation={2} key={workout.id}>
          <CardContent>
            <Stack direction={"row"} alignItems={"center"} spacing={2}>
              <Avatar
                sx={{ width: 56, height: 56 }}
                src="https://cdn-icons-png.flaticon.com/512/1048/1048953.png"
              />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {workout.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {workout.lastCompleted
                    ? "Last Train :" + workout.lastCompleted
                    : "You didn't training this wet"}
                </Typography>

                <NavLink to={`/workout/${workout.id}`}>
                  <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                    VER TREINO{" "}
                  </Button>
                </NavLink>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default WorkoutList;
