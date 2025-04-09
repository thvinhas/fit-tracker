import { BrowserRouter as Router } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Login from "./Auth/Login";
import PrivateRoute from "./PrivateRoute";
import SingUp from "./Auth/SingUp";
import WorkoutList from "./Atlete/WorkoutList";
import WorkoutScreen from "./Atlete/workoutScreen";
import Dashboard from "./Dashboard";
import SignIn from "./sign-in/SignIn";

function App() {
  return (
    <Router>
      <div>
        <section>
          <Routes>
            <Route path="/login" element={<SignIn />}></Route>
            <Route path="/singUp" element={<SingUp />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/workoutList"
              element={
                <PrivateRoute>
                  <WorkoutList></WorkoutList>
                </PrivateRoute>
              }
            />
            <Route
              path="/workout/:id"
              element={
                <PrivateRoute>
                  <WorkoutScreen />
                </PrivateRoute>
              }
            />
          </Routes>
        </section>
      </div>
    </Router>
  );
}

export default App;
