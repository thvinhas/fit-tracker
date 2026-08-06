import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { getSessions, getWorkouts } from "../services/firestore";
import Container from "../components/Container";
import Card from "../components/Card";
import WeeklyRing from "../components/WeeklyRing";
import {
  buttonPrimaryLinkClass,
  buttonGhostLinkClass,
} from "../components/Button";
import {
  getLocalDayKey,
  getLogTimestampMs,
  computeStreak,
  sessionsThisWeek,
  formatRelativeDate,
  weeklyVolume,
} from "../utils/dateHelpers";

const WEEKLY_GOAL = 5;

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [workoutsData, sessionsData] = await Promise.all([
        getWorkouts(user.uid),
        getSessions(user.uid),
      ]);
      setWorkouts(workoutsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [workoutsData, sessionsData] = await Promise.all([
          getWorkouts(user.uid),
          getSessions(user.uid),
        ]);
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

  useEffect(() => {
    if (!user) return;
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, loadData]);

  const [todayKey] = useState(() => getLocalDayKey(Date.now()));

  const workoutOfTheDay = useMemo(() => {
    if (workouts.length === 0) return null;

    const lastSession = sessions[0];
    if (!lastSession) return workouts[0];

    const lastIndex = workouts.findIndex(
      (w) => w.id === lastSession.workoutId,
    );
    if (lastIndex === -1) return workouts[0];

    return workouts[(lastIndex + 1) % workouts.length];
  }, [workouts, sessions]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const weekCount = useMemo(() => sessionsThisWeek(sessions), [sessions]);
  const volume = useMemo(() => weeklyVolume(sessions), [sessions]);
  const firstName = (user?.displayName || user?.email || "").split(
    /[\s@]/,
  )[0];
  const todayLabel = capitalize(
    new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    }),
  );

  const workoutMap = useMemo(() => {
    const map = {};
    workouts.forEach((w) => {
      map[w.id] = w.name;
    });
    return map;
  }, [workouts]);

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => getLogTimestampMs(b) - getLogTimestampMs(a))
      .slice(0, 5)
      .filter((s) => s.workoutId)
      .map((session) => ({
        ...session,
        workoutName: workoutMap[session.workoutId] || "Treino",
      }));
  }, [sessions, workoutMap]);

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
    <Container>
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          {todayLabel}
        </p>
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight mt-0.5">
          {greeting()}, {firstName}
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="flex gap-3 mb-6"
      >
        <WeeklyRing completed={weekCount} goal={WEEKLY_GOAL} />
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex-1 rounded-2xl bg-surface3 border-border-subtle px-4 py-3 flex items-center justify-between shadow-inner-glow">
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-bold">
              Sequência
            </p>
            <p className="text-lg font-extrabold text-primary tabular-nums">
              {streak}
              <span className="text-xs font-bold text-text-muted ml-1">
                dias
              </span>
            </p>
          </div>
          <div className="flex-1 rounded-2xl bg-surface3 border-border-subtle px-4 py-3 flex items-center justify-between shadow-inner-glow">
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-bold">
              Volume 7d
            </p>
            <p className="text-lg font-extrabold text-text-primary tabular-nums">
              {(volume / 1000).toFixed(1)}
              <span className="text-xs font-bold text-text-muted ml-1">t</span>
            </p>
          </div>
        </div>
      </motion.div>

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
          <Card className="p-5 border-primary/30 bg-primaryDim">
            <p className="text-sm text-text-secondary font-bold mb-4">
              Crie um treino para começar a registrar progresso.
            </p>
            <Link to="/workouts/new" className={`${buttonPrimaryLinkClass}`}>
              Criar treino
            </Link>
          </Card>
        </motion.div>
      )}

      {recentSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="mb-6"
        >
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-3">
            Últimas sessões
          </h3>
          <div className="flex flex-col gap-2">
            {recentSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.35 + index * 0.05,
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
              >
                <Link to={`/workout/${session.workoutId}/start`}>
                  <Card className="p-3 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform hover:bg-surface2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">
                        {session.workoutName}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {formatRelativeDate(getLogTimestampMs(session))}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                      {session.duration
                        ? `${Math.floor(session.duration / 60)} min`
                        : "Feito"}
                    </span>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 400, damping: 25 }}
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
                (session) =>
                  session.workoutId === workout.id &&
                  getLocalDayKey(getLogTimestampMs(session)) === todayKey,
              );
              return (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.5 + index * 0.05,
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
