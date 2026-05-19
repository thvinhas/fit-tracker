import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getWorkouts, getSessions } from "../services/firestore";
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
  const [workouts, setWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        console.log("Carregando dados para userId:", user.uid);
        const workoutsData = await getWorkouts(user.uid);
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
  }, [user, location]);

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
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        <p className="text-sm text-zinc-500">Carregando…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <Container title="Início" subtitle="Carregando seu espaço…">
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container title="Início" subtitle="Foco no treino de hoje.">
      <div className="flex gap-3 mb-8">
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            Streak
          </p>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums mt-0.5">
            {streak}
            <span className="text-sm font-semibold text-zinc-500 ml-1">
              dias
            </span>
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            7 dias
          </p>
          <p className="text-2xl font-bold text-zinc-50 tabular-nums mt-0.5">
            {weekCount}
            <span className="text-sm font-semibold text-zinc-500 ml-1">
              sessões
            </span>
          </p>
        </div>
      </div>

      {workoutOfTheDay ? (
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            Próximo treino
          </p>
          <Card highlighted className="p-5">
            <h2 className="text-xl font-bold text-zinc-50 leading-tight">
              {workoutOfTheDay.name}
            </h2>
            <p className="text-sm text-zinc-400 mt-2 mb-6">
              Veja os exercícios ou comece a sessão agora.
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
        </div>
      ) : (
        <Card className="p-6 mb-10 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-100/90 font-medium">
            Crie um treino para começar a registrar progresso.
          </p>
          <Link to="/workouts/new" className={`${buttonPrimaryLinkClass} mt-4`}>
            Criar treino
          </Link>
        </Card>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
          Seus planos
        </h3>
        <Link
          to="/workouts"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
        >
          Gerenciar →
        </Link>
      </div>

      {workouts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-zinc-500 text-sm mb-4">
            Ainda sem treinos salvos.
          </p>
          <Link to="/workouts/new" className={buttonPrimaryLinkClass}>
            Criar primeiro treino
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((workout) => {
            const done = sessions.some(
              (session) => session.workoutId === workout.id,
            );
            return (
              <Link key={workout.id} to={`/workout/${workout.id}`}>
                <Card className="p-4 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform">
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-zinc-100 truncate">
                      {workout.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {done ? "Última sessão registada" : "Por fazer"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      done
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {done ? "Feito" : "Abrir"}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
};

export default Dashboard;
