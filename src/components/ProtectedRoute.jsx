import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6">
        <div
          className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin"
          aria-hidden
        />
        <p className="text-sm text-zinc-500">Carregando…</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
