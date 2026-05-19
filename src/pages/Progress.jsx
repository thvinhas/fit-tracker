import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getSessions } from "../services/firestore";
import Container from "../components/Container";
import Card from "../components/Card";

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

const Progress = () => {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getSessions(user.uid);
        setSessions(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const weekCount = useMemo(() => sessionsThisWeek(sessions), [sessions]);
  const total = sessions.length;

  if (authLoading || loading) {
    return (
      <Container title="Progresso" subtitle="Consistência e ritmo.">
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        </div>
      </Container>
    );
  }

  const recent = [...sessions].sort((a, b) => logMs(b) - logMs(a)).slice(0, 8);

  return (
    <Container title="Progresso" subtitle="Consistência e ritmo.">
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            Streak
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
            {streak}
            <span className="text-xs font-semibold text-zinc-500 ml-1">
              dias
            </span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            7 dias
          </p>
          <p className="text-2xl font-bold text-zinc-50 mt-1 tabular-nums">
            {weekCount}
            <span className="text-xs font-semibold text-zinc-500 ml-1">
              sessões
            </span>
          </p>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
          Total
        </p>
        <p className="text-xl font-bold text-zinc-100 mt-1 tabular-nums">
          {total}{" "}
          <span className="text-sm font-medium text-zinc-500">
            treinos concluídos
          </span>
        </p>
      </Card>

      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">
        Recentes
      </h3>
      {recent.length === 0 ? (
        <Card className="p-6 text-center text-sm text-zinc-500">
          Complete um treino para ver o histórico aqui.
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((log) => (
            <Card key={log.id} className="px-4 py-3 flex justify-between gap-3">
              <span className="text-sm text-zinc-400">
                {logMs(log)
                  ? new Date(logMs(log)).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
              <span className="text-sm font-medium text-zinc-200 truncate">
                Sessão registrada
              </span>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default Progress;
