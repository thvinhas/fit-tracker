import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getSessions } from "../services/firestore";
import Container from "../components/Container";
import Card from "../components/Card";
import { motion } from "framer-motion";
import {
  computeStreak,
  getLogTimestampMs,
  sessionsThisWeek,
} from "../utils/dateHelpers";

const Progress = () => {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadSessions = async () => {
      try {
        const data = await getSessions(user.uid);
        if (isMounted) {
          setSessions(data);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const weekCount = useMemo(() => sessionsThisWeek(sessions), [sessions]);
  const total = sessions.length;

  if (authLoading || loading) {
    return (
      <Container title="Progresso" subtitle="Consistência e ritmo.">
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        </div>
      </Container>
    );
  }

  const recent = [...sessions]
    .sort((a, b) => getLogTimestampMs(b) - getLogTimestampMs(a))
    .slice(0, 8);

  return (
    <Container title="Progresso" subtitle="Consistência e ritmo.">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔥</span>
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                Streak
              </p>
            </div>
            <p className="text-2xl font-black text-primary mt-1 tabular-nums">
              {streak}
              <span className="text-xs font-bold text-text-muted ml-1">
                dias
              </span>
            </p>
          </Card>
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
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💪</span>
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                7 dias
              </p>
            </div>
            <p className="text-2xl font-black text-text-primary mt-1 tabular-nums">
              {weekCount}
              <span className="text-xs font-bold text-text-muted ml-1">
                sessões
              </span>
            </p>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
        className="mb-6"
      >
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
            Total
          </p>
          <p className="text-xl font-black text-text-primary mt-1 tabular-nums">
            {total}{" "}
            <span className="text-sm font-bold text-text-muted">
              treinos concluídos
            </span>
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 25 }}
      >
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">
          Recentes
        </h3>
        {recent.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-muted">
            Complete um treino para ver o histórico aqui.
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.4 + index * 0.05,
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
              >
                <Card className="px-4 py-3 flex justify-between gap-3">
                  <span className="text-sm text-text-tertiary">
                    {getLogTimestampMs(log)
                      ? new Date(getLogTimestampMs(log)).toLocaleString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "—"}
                  </span>
                  <span className="text-sm font-bold text-text-secondary truncate">
                    Sessão registrada
                  </span>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Container>
  );
};

export default Progress;
