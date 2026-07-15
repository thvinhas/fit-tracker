import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { getSessions } from "../services/firestore";
import Container from "../components/Container";
import Button from "../components/Button";
import Card from "../components/Card";
import { computeStreak } from "../utils/dateHelpers";

const Profile = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getSessions(user.uid).then((data) => {
      if (isMounted) setSessions(data);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const displayName = user?.displayName || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      })
    : "—";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <Container title="Perfil">
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container title="Perfil" subtitle="Conta e sessão.">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Card className="p-5 mb-6 flex items-center gap-4">
          <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-[#181510] font-extrabold text-xl">
              {initial || "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-text-primary truncate">
              {user?.displayName || "Usuário"}
            </p>
            <p className="text-sm text-text-tertiary mt-0.5 break-all">
              {user?.email || "—"}
            </p>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 400, damping: 25 }}
        className="mb-8"
      >
        <Card className="divide-y divide-border-subtle">
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-text-tertiary font-medium">
              Treinos concluídos
            </span>
            <span className="text-sm font-extrabold text-text-primary tabular-nums">
              {sessions.length}
            </span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-text-tertiary font-medium">
              Sequência atual
            </span>
            <span className="text-sm font-extrabold text-primary tabular-nums">
              {streak} dias
            </span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-text-tertiary font-medium">
              Membro desde
            </span>
            <span className="text-sm font-extrabold text-text-primary">
              {memberSince}
            </span>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
      >
        <Button variant="danger" size="lg" onClick={handleLogout}>
          Sair
        </Button>
      </motion.div>
    </Container>
  );
};

export default Profile;
