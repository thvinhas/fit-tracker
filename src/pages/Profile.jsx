import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import Container from "../components/Container";
import Button from "../components/Button";
import Card from "../components/Card";

const Profile = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

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
        <Card className="p-5 mb-8">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
            Email
          </p>
          <p className="text-sm text-text-primary mt-2 break-all font-bold">
            {user?.email || "—"}
          </p>
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
