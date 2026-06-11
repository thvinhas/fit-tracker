import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

// Workouts
export const getWorkouts = async (userId) => {
  const q = query(
    collection(db, "workouts"),
    where("userId", "==", userId),
    orderBy("order"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addWorkout = async (workout) => {
  const result = await addDoc(collection(db, "workouts"), workout);
  return result;
};

export const updateWorkout = async (id, workout) => {
  return await updateDoc(doc(db, "workouts", id), workout);
};

export const deleteWorkout = async (id) => {
  return await deleteDoc(doc(db, "workouts", id));
};

// Exercises
export const getExercises = async (workoutId) => {
  const q = query(
    collection(db, "exercises"),
    where("workoutId", "==", workoutId),
    orderBy("order"),
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => {
    const oa = a.order;
    const ob = b.order;
    if (oa != null && ob != null && oa !== ob) return oa - ob;
    if (oa != null && ob == null) return -1;
    if (oa == null && ob != null) return 1;
    const ta = a.createdAt?.seconds ?? 0;
    const tb = b.createdAt?.seconds ?? 0;
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });
};

export const addExercise = async (exercise) => {
  return await addDoc(collection(db, "exercises"), exercise);
};

export const updateExercise = async (id, exercise) => {
  return await updateDoc(doc(db, "exercises", id), exercise);
};

export const deleteExercise = async (id) => {
  return await deleteDoc(doc(db, "exercises", id));
};

// Workout Logs
export const getWorkoutLogs = async (userId) => {
  const q = query(
    collection(db, "workoutLogs"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addWorkoutLog = async (log) => {
  return await addDoc(collection(db, "workoutLogs"), log);
};

// Exercise Logs
export const getExerciseLogs = async (exerciseId) => {
  const q = query(
    collection(db, "exerciseLogs"),
    where("exerciseId", "==", exerciseId),
    orderBy("date", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addExerciseLog = async (log) => {
  return await addDoc(collection(db, "exerciseLogs"), log);
};

// Sessions - New collection to track workout sessions
export const getSessions = async (userId) => {
  const q = query(
    collection(db, "sessions"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addSession = async (session) => {
  return await addDoc(collection(db, "sessions"), session);
};

export const getSessionExerciseLogs = async (sessionId) => {
  const q = query(
    collection(db, "exerciseLogs"),
    where("sessionId", "==", sessionId),
    orderBy("date", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
