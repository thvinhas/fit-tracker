import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const RestTimer = ({ isActive, onComplete, duration = 90, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (duration - timeLeft) / duration;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  const handleAddTime = () => {
    setTimeLeft((prev) => prev + 30);
  };

  const handleReduceTime = () => {
    setTimeLeft((prev) => Math.max(0, prev - 15));
  };

  const handleSkip = () => {
    setTimeLeft(0);
    onComplete?.();
  };

  if (!isActive) return null;

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-20 left-4 right-4 z-50"
      >
        <div className="bg-surface2 border border-border-subtle rounded-xl p-3 shadow-surface-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#00ff88"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                  style={{
                    filter: "drop-shadow(0 0 4px rgba(0, 255, 136, 0.4))",
                  }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary tabular-nums">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Rest
              </p>
              <p className="text-xs font-semibold text-text-primary">
                Descanso
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="px-3 py-1.5 rounded-lg bg-surface3 text-text-tertiary text-xs font-semibold hover:bg-surface4 transition-colors"
          >
            Expandir
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed inset-4 z-50 flex items-center justify-center p-4"
      >
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onDismiss}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className="relative bg-surface2 border border-border-subtle rounded-2xl p-6 shadow-surface-xl w-full max-w-sm"
        >
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex flex-col items-center">
            <div className="relative mb-5">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#00ff88"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(0, 255, 136, 0.5))",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-primary tabular-nums tracking-tight">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-1">
                  Descanso
                </span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={handleReduceTime}
                className="w-12 h-12 rounded-xl bg-surface3 border border-border-subtle text-text-primary font-bold text-lg hover:bg-surface4 hover:border-border-hover active:scale-95 transition-all shadow-inner-glow"
              >
                −15s
              </button>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                  isPaused
                    ? "bg-primary text-black shadow-glow"
                    : "bg-surface3 border border-border-subtle text-text-primary hover:bg-surface4 hover:border-border-hover shadow-inner-glow"
                }`}
              >
                {isPaused ? "▶" : "⏸"}
              </button>
              <button
                onClick={handleAddTime}
                className="w-12 h-12 rounded-xl bg-surface3 border border-border-subtle text-text-primary font-bold text-lg hover:bg-surface4 hover:border-border-hover active:scale-95 transition-all shadow-inner-glow"
              >
                +30s
              </button>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={handleSkip}
                className="flex-1 py-2.5 rounded-xl bg-surface3 text-text-tertiary text-sm font-semibold hover:bg-surface4 hover:text-text-secondary transition-colors"
              >
                Pular
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="flex-1 py-2.5 rounded-xl bg-surface3 text-text-tertiary text-sm font-semibold hover:bg-surface4 hover:text-text-secondary transition-colors"
              >
                Minimizar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RestTimer;
