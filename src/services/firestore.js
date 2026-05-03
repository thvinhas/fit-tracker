import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// Workouts
export const getWorkouts = async (userId) => {
  const q = query(collection(db, "workouts"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const workouts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // Sort by order field client-side
  return workouts.sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const addWorkout = async (workout) => {
  return await addDoc(collection(db, "workouts"), workout);
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
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
  const q = query(collection(db, "workoutLogs"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // Sort by date client-side (newest first)
  return logs.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
};

export const addWorkoutLog = async (log) => {
  return await addDoc(collection(db, "workoutLogs"), log);
};

// Exercise Logs
export const getExerciseLogs = async (exerciseId) => {
  const q = query(
    collection(db, "exerciseLogs"),
    where("exerciseId", "==", exerciseId),
  );
  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // Sort by date client-side (newest first)
  return logs.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
};

export const addExerciseLog = async (log) => {
  return await addDoc(collection(db, "exerciseLogs"), log);
};
