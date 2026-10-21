// Pure helpers — no Firestore calls here. Caller fetches workouts/programs
// once and reuses these across renders without refetching.

export const getActiveProgram = (programs) =>
  programs.find((p) => p.status === "active") || null;

export const getActiveProgramWorkouts = (workouts, programs) => {
  const active = getActiveProgram(programs);
  if (!active) {
    // Still on the implicit program: every workout with no programId.
    return workouts.filter((w) => !w.programId);
  }
  return workouts.filter((w) => w.programId === active.id);
};

export const getArchivedPrograms = (programs) =>
  [...programs]
    .filter((p) => p.status === "archived")
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

export const getProgramWorkouts = (workouts, programId) =>
  workouts.filter((w) => w.programId === programId);
