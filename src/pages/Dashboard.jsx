import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { getSessions, getWorkouts } from "../services/firestore";
import Container from "../components/Container";
import Card from "../components/Card";
import {
  buttonPrimaryLinkClass,
  buttonGhostLinkClass,
} from "../components/Button";
import { computeStreak, sessionsThisWeek } from "../utils/dateHelpers";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [workouts, setWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchData = async () => {
      try {
        const workoutsData = await getWorkouts(user.uid);
        const sessionsData = await getSessions(user.uid);
        if (!isMounted) return;
        setWorkouts(workoutsData);
        setSessions(sessionsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const workoutOfTheDay = useMemo(() => {
    if (workouts.length === 0) return null;
    const completedIds = sessions.map((session) => session.workoutId);
    const next = workouts.find((w) => !completedIds.includes(w.id));
    return next || workouts[0];
  }, [workouts, sessions]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const weekCount = useMemo(() => sessionsThisWeek(sessions), [sessions]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-text-muted font-medium">Carregando…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <Container title="Início" subtitle="Carregando seu espaço…">
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container title="Início" subtitle="Foco no treino de hoje.">
      <div className="flex gap-3 mb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex-1 rounded-2xl bg-surface3 border-border-subtle px-4 py-4 shadow-inner-glow"
        >
          <div className="flex items-center gap-2 mb-1">
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-lg"
            >
              🔥
            </motion.span>
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
              Streak
            </p>
          </div>
          <p className="text-3xl font-black text-primary tabular-nums tracking-tight">
            {streak}
            <span className="text-sm font-bold text-text-muted ml-1">dias</span>
          </p>
        </motion.div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            delay: 0.1,
          }}
          className="flex-1 rounded-2xl bg-surface3 border-border-subtle px-4 py-4 shadow-inner-glow"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💪</span>
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
              7 dias
            </p>
          </div>
          <p className="text-3xl font-black text-text-primary tabular-nums tracking-tight">
            {weekCount}
            <span className="text-sm font-bold text-text-muted ml-1">
              sessões
            </span>
          </p>
        </motion.div>
      </div>

      {workoutOfTheDay ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="mb-6"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
            Próximo treino
          </p>
          <Card highlighted className="p-5">
            <h2 className="text-2xl font-black text-text-primary leading-tight mb-2">
              {workoutOfTheDay.name}
            </h2>
            <p className="text-sm text-text-tertiary mb-5">
              Pronto para começar? Vamos lá.
            </p>
            <Link
              to={`/workout/${workoutOfTheDay.id}/start`}
              className={buttonPrimaryLinkClass}
            >
              Iniciar treino
            </Link>
            <Link
              to={`/workout/${workoutOfTheDay.id}`}
              className={`${buttonGhostLinkClass} w-full mt-3 justify-center`}
            >
              Ver plano
            </Link>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="mb-6"
        >
          <Card className="p-5 border-accent/30 bg-accent/5 shadow-glow-accent">
            <p className="text-sm text-text-secondary font-bold mb-4">
              Crie um treino para começar a registrar progresso.
            </p>
            <Link to="/workouts/new" className={`${buttonPrimaryLinkClass}`}>
              Criar treino
            </Link>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">
            Seus planos
          </h3>
          <Link
            to="/workouts"
            className="text-xs font-bold text-primary hover:text-primaryGlow transition-colors"
          >
            Gerenciar →
          </Link>
        </div>

        {workouts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-muted text-sm mb-4">
              Ainda sem treinos salvos.
            </p>
            <Link to="/workouts/new" className={buttonPrimaryLinkClass}>
              Criar primeiro treino
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {workouts.map((workout, index) => {
              const done = sessions.some(
                (session) => session.workoutId === workout.id,
              );
              return (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.4 + index * 0.05,
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                >
                  <Link to={`/workout/${workout.id}`}>
                    <Card className="p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform hover:bg-surface2">
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-text-primary truncate">
                          {workout.name}
                        </h4>
                        <p className="text-xs text-text-tertiary mt-1">
                          {done ? "Última sessão registada" : "Por fazer"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full ${
                          done
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-surface2 text-text-muted border-border-subtle"
                        }`}
                      >
                        {done ? "Feito" : "Abrir"}
                      </span>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </Container>
  );
};

export default Dashboard;
