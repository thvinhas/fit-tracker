import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WorkoutView from "./pages/WorkoutView";
import WorkoutStart from "./pages/WorkoutStart";
import Workouts from "./pages/Workouts";
import WorkoutForm from "./pages/WorkoutForm";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2800,
          className: "!bg-zinc-900 !text-zinc-100 !border !border-white/10 !shadow-xl",
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="workouts/new" element={<WorkoutForm />} />
          <Route path="workouts/:id/edit" element={<WorkoutForm />} />
          <Route path="workout/:id" element={<WorkoutView />} />
          <Route path="workout/:id/start" element={<WorkoutStart />} />
          <Route path="progress" element={<Progress />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
