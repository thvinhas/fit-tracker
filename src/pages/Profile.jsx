import { useNavigate } from "react-router-dom";
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
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container title="Perfil" subtitle="Conta e sessão.">
      <Card className="p-5 mb-8">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
          Email
        </p>
        <p className="text-sm text-zinc-100 mt-2 break-all">{user?.email || "—"}</p>
      </Card>

      <Button variant="danger" size="lg" onClick={handleLogout}>
        Sair
      </Button>
    </Container>
  );
};

export default Profile;
