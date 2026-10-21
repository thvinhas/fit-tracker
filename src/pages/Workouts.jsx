import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import {
  deleteWorkout,
  getWorkouts,
  getExercises,
  getSessions,
  updateWorkout,
  getPrograms,
  startNewProgram,
} from "../services/firestore";
import toast from "react-hot-toast";
import Container from "../components/Container";
import Card from "../components/Card";
import Button, {
  buttonPrimaryLinkClass,
  buttonSecondaryLinkClass,
} from "../components/Button";
import Input from "../components/Input";
import { ListSkeleton } from "../components/Skeleton";
import {
  formatDuration,
  formatRelativeDate,
  getLogTimestampMs,
} from "../utils/dateHelpers";
import { estimateDurationMs } from "../utils/estimateDuration";
import { pluralize } from "../utils/pluralize";
import {
  getActiveProgram,
  getActiveProgramWorkouts,
  getArchivedPrograms,
  getProgramWorkouts,
} from "../utils/programs";

const Workouts = () => {
  const { user, loading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [draftWorkouts, setDraftWorkouts] = useState([]);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [workoutsData, programsData] = await Promise.all([
      getWorkouts(user.uid),
      getPrograms(user.uid),
    ]);
    const [exercisesByWorkout, sessions] = await Promise.all([
      Promise.all(workoutsData.map((w) => getExercises(w.id))),
      getSessions(user.uid),
    ]);

    const lastSessionMsByWorkout = {};
    sessions.forEach((session) => {
      const ts = getLogTimestampMs(session);
      const current = lastSessionMsByWorkout[session.workoutId];
      if (!current || ts > current) {
        lastSessionMsByWorkout[session.workoutId] = ts;
      }
    });

    const enriched = workoutsData.map((workout, index) => {
      const exercises = exercisesByWorkout[index];
      const totalSets = exercises.reduce(
        (sum, ex) => sum + (Number(ex.sets) || 1),
        0,
      );
      return {
        ...workout,
        exerciseCount: exercises.length,
        estimatedDurationMs:
          exercises.length > 0 ? estimateDurationMs(totalSets) : null,
        lastSessionMs: lastSessionMsByWorkout[workout.id] || null,
      };
    });

    setWorkouts(enriched);
    setPrograms(programsData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    (async () => {
      await loadData();
    })();
  }, [loadData]);

  const activeProgram = getActiveProgram(programs);
  const currentProgramWorkouts = getActiveProgramWorkouts(workouts, programs);
  const activeProgramName = activeProgram?.name || "Treinos";
  const archivedPrograms = getArchivedPrograms(programs);

  const startReorder = () => {
    setDraftWorkouts([...currentProgramWorkouts]);
    setIsReorderMode(true);
  };

  const cancelReorder = () => {
    setIsReorderMode(false);
  };

  const moveWorkout = (index, direction) => {
    const next = [...draftWorkouts];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setDraftWorkouts(next);
  };

  const saveReorder = async () => {
    try {
      await Promise.all(
        draftWorkouts.map((workout, index) =>
          updateWorkout(workout.id, { order: index }),
        ),
      );
      setWorkouts(
        draftWorkouts.map((workout, index) => ({
          ...workout,
          order: index,
        })),
      );
      setIsReorderMode(false);
      toast.success("Ordem dos treinos atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar ordem: " + error.message);
    }
  };

  const handleDelete = async (workoutId) => {
    setOpenMenuId(null);
    if (
      !window.confirm("Excluir este treino? Esta ação não pode ser desfeita.")
    ) {
      return;
    }
    try {
      await deleteWorkout(workoutId);
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      toast.success("Treino excluído.");
    } catch (error) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const handleCreateProgram = async () => {
    if (!newProgramName.trim()) return;
    try {
      await startNewProgram(user.uid, newProgramName.trim());
      setShowNewProgramModal(false);
      setNewProgramName("");
      setLoading(true);
      await loadData();
      toast.success("Novo programa criado!");
    } catch (error) {
      toast.error("Erro ao criar programa: " + error.message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-text-muted font-medium">Carregando…</p>
      </div>
    );
  }

  return (
    <Container title="Treinos" subtitle="Planos e edição rápida.">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
          <Link to="/workouts/new" className={`${buttonPrimaryLinkClass}`}>
            Novo treino
          </Link>
          <div className="flex flex-wrap gap-2">
            {isReorderMode ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={cancelReorder}
                >
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={saveReorder}>
                  Salvar ordem
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={startReorder}
              >
                Organizar treinos
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-text-secondary">
            Programa:{" "}
            <span className="text-text-primary">{activeProgramName}</span>
          </p>
          <button
            type="button"
            onClick={() => setShowNewProgramModal(true)}
            className="text-xs font-bold text-primary hover:underline"
          >
            Novo programa
          </button>
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">
          Biblioteca
        </h3>
      </motion.div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : currentProgramWorkouts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <Card className="p-8 text-center">
            <p className="text-text-muted text-sm mb-4">Nenhum treino ainda.</p>
            <Link to="/workouts/new" className={buttonPrimaryLinkClass}>
              Criar treino
            </Link>
          </Card>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-2">
          {(isReorderMode ? draftWorkouts : currentProgramWorkouts).map((workout, index) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2 + index * 0.05,
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
            >
              <Card className="p-4 relative">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h4 className="text-base font-bold text-text-primary">
                    {workout.name}
                  </h4>
                  {!isReorderMode && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === workout.id ? null : workout.id,
                          )
                        }
                        aria-label="Mais opções"
                        className="h-11 w-11 flex items-center justify-center rounded-full text-text-muted hover:bg-white/5 hover:text-text-secondary transition-colors"
                      >
                        ⋯
                      </button>
                      {openMenuId === workout.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full z-20 w-36 rounded-xl border border-border-subtle bg-surface2 shadow-surface-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleDelete(workout.id)}
                              className="w-full px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-dangerDim transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {isReorderMode && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => moveWorkout(index, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => moveWorkout(index, "down")}
                        disabled={
                          index ===
                          (isReorderMode
                            ? draftWorkouts.length
                            : currentProgramWorkouts.length) -
                            1
                        }
                      >
                        ↓
                      </Button>
                    </div>
                  )}
                </div>
                {!isReorderMode && (
                  <>
                    <p className="text-[11px] text-text-muted mb-4">
                      {workout.exerciseCount}{" "}
                      {pluralize(workout.exerciseCount, "exercício", "exercícios")}
                      {workout.estimatedDurationMs != null &&
                        ` · ~${formatDuration(workout.estimatedDurationMs)}`}
                      {workout.lastSessionMs
                        ? ` · última vez ${formatRelativeDate(workout.lastSessionMs)}`
                        : " · nunca feito"}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to={`/workout/${workout.id}`}
                        className={`${buttonSecondaryLinkClass} flex-1`}
                      >
                        Abrir
                      </Link>
                      <Link
                        to={`/workouts/${workout.id}/edit`}
                        className={`${buttonSecondaryLinkClass} flex-1`}
                      >
                        Editar
                      </Link>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {archivedPrograms.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">
            Histórico
          </h3>
          <div className="flex flex-col gap-2">
            {archivedPrograms.map((program) => {
              const programWorkouts = getProgramWorkouts(workouts, program.id);
              const isExpanded = expandedHistoryId === program.id;
              return (
                <div key={program.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedHistoryId(isExpanded ? null : program.id)
                    }
                    className="w-full flex items-center justify-between rounded-xl bg-surface2 border border-border-subtle px-4 py-3 text-left"
                  >
                    <span className="text-sm font-bold text-text-primary">
                      {program.name}
                    </span>
                    <span className="text-xs text-text-muted">
                      {programWorkouts.length}{" "}
                      {pluralize(programWorkouts.length, "plano", "planos")}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="flex flex-col gap-2 mt-2 pl-2">
                      {programWorkouts.map((workout) => (
                        <Card key={workout.id} className="p-4 relative">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="text-sm font-bold text-text-primary">
                              {workout.name}
                            </h4>
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === workout.id
                                      ? null
                                      : workout.id,
                                  )
                                }
                                aria-label="Mais opções"
                                className="h-11 w-11 flex items-center justify-center rounded-full text-text-muted hover:bg-white/5 hover:text-text-secondary transition-colors"
                              >
                                ⋯
                              </button>
                              {openMenuId === workout.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-full z-20 w-36 rounded-xl border border-border-subtle bg-surface2 shadow-surface-lg overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(workout.id)}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-dangerDim transition-colors"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <Link
                            to={`/workout/${workout.id}`}
                            className={buttonSecondaryLinkClass}
                          >
                            Abrir
                          </Link>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showNewProgramModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewProgramModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface2 border border-border-subtle rounded-2xl p-5 max-w-sm w-full shadow-surface-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Novo programa
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                "{activeProgramName}" vira histórico. Como se chama o novo
                programa?
              </p>
              <Input
                value={newProgramName}
                onChange={(e) => setNewProgramName(e.target.value)}
                placeholder="Ex: Bloco Hipertrofia"
              />
              <div className="flex gap-3 mt-4">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowNewProgramModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="md"
                  className="flex-1"
                  onClick={handleCreateProgram}
                >
                  Criar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default Workouts;
