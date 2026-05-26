import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { getSessions } from "../services/firestore";
import Button from "../components/Button";
import Container from "../components/Container";
import Card from "../components/Card";

const WorkoutCompletion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessionData = async () => {
      if (!user) return;

      try {
        const sessions = await getSessions(user.uid);
        // Get the most recent session
        const recentSession = sessions[0];

        if (recentSession) {
          setSessionData(recentSession);
        }
      } catch (error) {
        console.error("Error loading session data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSessionData();
  }, [user]);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatVolume = (volume) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="max-w-lg mx-auto"
      >
        {/* Celebration Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">
            Treino Concluído!
          </h1>
          <p className="text-base text-text-tertiary">
            Excelente trabalho. Continue assim.
          </p>
        </motion.div>

        {/* Stats Grid */}
        {sessionData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Duração
              </p>
              <p className="text-2xl font-black text-primary tabular-nums">
                {formatDuration(sessionData.duration || 0)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Volume
              </p>
              <p className="text-2xl font-black text-text-primary tabular-nums">
                {formatVolume(sessionData.totalVolume || 0)}
                <span className="text-sm font-bold text-text-muted ml-1">
                  kg
                </span>
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Exercícios
              </p>
              <p className="text-2xl font-black text-text-primary tabular-nums">
                {sessionData.exerciseCount || 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Séries
              </p>
              <p className="text-2xl font-black text-text-primary tabular-nums">
                {sessionData.exerciseCount || 0}
              </p>
            </Card>
          </motion.div>
        )}

        {/* PR Celebration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.4,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="mb-6"
        >
          <Card className="p-5 border-accent/30 bg-accent/5 shadow-glow-accent">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.5,
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                className="text-4xl"
              >
                🔥
              </motion.div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">
                  Novo PR!
                </p>
                <p className="text-base font-bold text-text-primary">
                  Continue progredindo
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="mb-8"
        >
          <Card className="p-5 text-center">
            <p className="text-sm text-text-secondary font-medium">
              Consistência é a chave do progresso. Cada treino conta.
            </p>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.6,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="space-y-3"
        >
          <Button size="lg" onClick={() => navigate("/")}>
            Voltar ao Início
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("/progress")}
          >
            Ver Progresso
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WorkoutCompletion;
