import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { getSessions } from "../services/firestore";
import { useOfflineStorage } from "../hooks/useOfflineStorage";
import Container from "../components/Container";
import Card from "../components/Card";
import {
  buttonPrimaryLinkClass,
  buttonGhostLinkClass,
} from "../components/Button";

const localDayKey = (ms) => {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

const logMs = (log) => (log.date?.seconds ? log.date.seconds * 1000 : 0);

const computeStreak = (logs) => {
  const keys = new Set(logs.map((l) => localDayKey(logMs(l))));
  if (keys.size === 0) return 0;
  const anchor = new Date();
  anchor.setHours(0, 0, 0, 0);
  let check = new Date(anchor);
  if (!keys.has(localDayKey(check.getTime()))) {
    check.setDate(check.getDate() - 1);
  }
  let streak = 0;
  for (;;) {
    const k = localDayKey(check.getTime());
    if (!keys.has(k)) break;
    streak += 1;
    check.setDate(check.getDate() - 1);
  }
  return streak;
};

const sessionsThisWeek = (logs) => {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  return logs.filter((l) => logMs(l) >= weekAgo).length;
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { getWorkoutsWithCache } = useOfflineStorage();
  const [workouts, setWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        console.log("Carregando dados para userId:", user.uid);
        const workoutsData = await getWorkoutsWithCache(user.uid);
        console.log("Workouts carregados:", workoutsData);
        const sessionsData = await getSessions(user.uid);
        console.log("Sessions carregados:", sessionsData);
        setWorkouts(workoutsData);
        setSessions(sessionsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, location, getWorkoutsWithCache]);

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
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex-1 rounded-2xl bg-surface3 border-border-subtle px-3 sm:px-4 py-3 sm:py-4 shadow-inner-glow"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-base sm:text-lg"
            >
              🔥
            </motion.span>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-text-muted font-bold">
              Streak
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-primary tabular-nums tracking-tight">
            {streak}
            <span className="text-xs sm:text-sm font-bold text-text-muted ml-1">
              dias
            </span>
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
          className="flex-1 rounded-2xl bg-surface3 border-border-subtle px-3 sm:px-4 py-3 sm:py-4 shadow-inner-glow"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="text-base sm:text-lg">💪</span>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-text-muted font-bold">
              7 dias
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-text-primary tabular-nums tracking-tight">
            {weekCount}
            <span className="text-xs sm:text-sm font-bold text-text-muted ml-1">
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
          className="mb-4 sm:mb-6"
        >
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-text-muted mb-2 sm:mb-3">
            Próximo treino
          </p>
          <Card highlighted className="p-4 sm:p-5">
            <h2 className="text-xl sm:text-2xl font-black text-text-primary leading-tight mb-2">
              {workoutOfTheDay.name}
            </h2>
            <p className="text-sm text-text-tertiary mb-4 sm:mb-5">
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
          className="mb-4 sm:mb-6"
        >
          <Card className="p-4 sm:p-5 border-accent/30 bg-accent/5 shadow-glow-accent">
            <p className="text-sm text-text-secondary font-bold mb-3 sm:mb-4">
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
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-text-muted">
            Seus planos
          </h3>
          <Link
            to="/workouts"
            className="text-[11px] sm:text-xs font-bold text-primary hover:text-primaryGlow transition-colors"
          >
            Gerenciar →
          </Link>
        </div>

        {workouts.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center">
            <p className="text-text-muted text-sm mb-4">
              Ainda sem treinos salvos.
            </p>
            <Link to="/workouts/new" className={buttonPrimaryLinkClass}>
              Criar primeiro treino
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-1.5 sm:gap-2">
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
                    <Card className="p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 active:scale-[0.98] transition-transform hover:bg-surface2">
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-text-primary truncate">
                          {workout.name}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-text-tertiary mt-1">
                          {done ? "Última sessão registada" : "Por fazer"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[9px] sm:text-[10px] font-bold uppercase px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${
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
