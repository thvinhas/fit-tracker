import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkoutView from './pages/WorkoutView';
import WorkoutStart from './pages/WorkoutStart';
import Workouts from './pages/Workouts';
import WorkoutForm from './pages/WorkoutForm';

function App() {
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/workout/:id" element={<ProtectedRoute><WorkoutView /></ProtectedRoute>} />
        <Route path="/workout/:id/start" element={<ProtectedRoute><WorkoutStart /></ProtectedRoute>} />
        <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
        <Route path="/workouts/new" element={<ProtectedRoute><WorkoutForm /></ProtectedRoute>} />
        <Route path="/workouts/:id/edit" element={<ProtectedRoute><WorkoutForm /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
