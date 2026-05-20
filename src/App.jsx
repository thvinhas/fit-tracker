import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import InstallPrompt from "./components/InstallPrompt";
import Login from "./pages/Login";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const WorkoutView = lazy(() => import("./pages/WorkoutView"));
const WorkoutStart = lazy(() => import("./pages/WorkoutStart"));
const WorkoutCompletion = lazy(() => import("./pages/WorkoutCompletion"));
const Workouts = lazy(() => import("./pages/Workouts"));
const WorkoutForm = lazy(() => import("./pages/WorkoutForm"));
const Progress = lazy(() => import("./pages/Progress"));
const Profile = lazy(() => import("./pages/Profile"));

// Loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2800,
          className:
            "!bg-zinc-900 !text-zinc-100 !border !border-white/10 !shadow-xl",
        }}
      />
      <InstallPrompt />
      <Suspense fallback={<LoadingFallback />}>
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
            <Route
              path="workout/:id/completion"
              element={<WorkoutCompletion />}
            />
            <Route path="progress" element={<Progress />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
