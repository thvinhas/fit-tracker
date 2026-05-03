import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";

// detecta mobile
const isMobile = () => /iPhone|iPad|Android/i.test(navigator.userAgent);

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // observa login/logout
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // 🔥 necessário para login via redirect (mobile)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect login error:", error);
      });

    return unsubscribe;
  }, []);

  // login com email
  const loginWithEmail = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // login com Google (corrigido)
  const loginWithGoogle = async () => {
    if (isMobile()) {
      // 📱 mobile → redirect
      return signInWithRedirect(auth, googleProvider);
    } else {
      // 💻 desktop → popup
      return signInWithPopup(auth, googleProvider);
    }
  };

  // logout
  const logout = async () => {
    return signOut(auth);
  };

  return {
    user,
    loading,
    loginWithEmail,
    loginWithGoogle,
    logout,
  };
};
