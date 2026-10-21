import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  getSessions,
  getSessionExerciseLogs,
  getWorkouts,
} from "../services/firestore";
import Container from "../components/Container";
import Card from "../components/Card";
import WeekBarChart from "../components/WeekBarChart";
import { ListSkeleton } from "../components/Skeleton";
import { motion } from "framer-motion";
import {
  computeStreak,
  formatDuration,
  getLogTimestampMs,
  sessionsThisWeek,
} from "../utils/dateHelpers";
import { pluralize } from "../utils/pluralize";
import { formatVolume } from "../utils/volume";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const Progress = () => {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [workoutMap, setWorkoutMap] = useState({});
  const [muscleVolume, setMuscleVolume] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadSessions = async () => {
      try {
        const [data, workouts] = await Promise.all([
          getSessions(user.uid),
          getWorkouts(user.uid),
        ]);
        if (!isMounted) return;
        setSessions(data);
        setWorkoutMap(
          Object.fromEntries(workouts.map((w) => [w.id, w.name])),
        );

        const weekAgo = Date.now() - WEEK_MS;
        const recentSessions = data.filter(
          (s) => getLogTimestampMs(s) >= weekAgo,
        );
        const logsBySession = await Promise.all(
          recentSessions.map((s) => getSessionExerciseLogs(s.id)),
        );
        if (!isMounted) return;

        const volume = {};
        logsBySession.flat().forEach((log) => {
          if (!log.muscleGroup || log.type === "warmup") return;
          volume[log.muscleGroup] = (volume[log.muscleGroup] || 0) + 1;
        });
        setMuscleVolume(volume);
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

  const muscleVolumeEntries = useMemo(
    () => Object.entries(muscleVolume).sort((a, b) => b[1] - a[1]),
    [muscleVolume],
  );
  const maxMuscleVolume = muscleVolumeEntries[0]?.[1] || 0;

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const weekCount = useMemo(() => sessionsThisWeek(sessions), [sessions]);
  const total = sessions.length;

  if (authLoading || loading) {
    return (
      <Container title="Progresso" subtitle="Consistência e ritmo.">
        <ListSkeleton rows={4} />
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
                Sequência
              </p>
            </div>
            <p className="text-2xl font-black text-primary mt-1 tabular-nums">
              {streak}
              <span className="text-xs font-bold text-text-muted ml-1">
                {pluralize(streak, "dia", "dias")}
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
        transition={{
          delay: 0.25,
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        className="mb-6"
      >
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-3">
            Últimos 7 dias
          </p>
          <WeekBarChart sessions={sessions} />
        </Card>
      </motion.div>

      {muscleVolumeEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.28,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="mb-6"
        >
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-3">
              Volume muscular (7 dias)
            </p>
            <div className="space-y-2.5">
              {muscleVolumeEntries.map(([group, sets]) => (
                <div key={group}>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-text-tertiary mb-1">
                    <span>{group}</span>
                    <span className="text-text-primary tabular-nums">
                      {sets} {pluralize(sets, "série", "séries")}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{
                        width: `${Math.max(4, Math.round((sets / maxMuscleVolume) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

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
                <Link
                  to={`/workout/${log.workoutId}/completion?session=${log.id}`}
                >
                  <Card className="px-4 py-3 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform hover:bg-surface2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-secondary truncate">
                        {workoutMap[log.workoutId] || "Treino"}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
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
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-text-tertiary">
                      <p className="font-bold text-text-primary tabular-nums">
                        {formatDuration(log.duration)}
                      </p>
                      <p className="tabular-nums">
                        {formatVolume(log.totalVolume || 0)}kg
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Container>
  );
};

export default Progress;
