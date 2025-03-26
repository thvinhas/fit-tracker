// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDataConnect } from "firebase/data-connect";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZDxAmQubgfNjc0B5qF0GjfF4ABq-khAQ",
  authDomain: "fittracker-fee91.firebaseapp.com",
  databaseURL:
    "https://fittracker-fee91-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "fittracker-fee91",
  storageBucket: "fittracker-fee91.firebasestorage.app",
  messagingSenderId: "834400635835",
  appId: "1:834400635835:web:1eef270d0c83a81463529e",
  measurementId: "G-DCJ6HDYSGB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;
