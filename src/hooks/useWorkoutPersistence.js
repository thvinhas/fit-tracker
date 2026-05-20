import { useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'activeWorkoutState';

export function useWorkoutPersistence(workoutState, onRestore) {
  const saveTimeoutRef = useRef(null);
  const lastStateRef = useRef(null);

  // Save workout state to localStorage with debouncing
  const saveState = useCallback((state) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const stateToSave = {
          ...state,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        lastStateRef.current = stateToSave;
      } catch (error) {
        console.error('Error saving workout state:', error);
      }
    }, 500); // Debounce saves to 500ms
  }, []);

  // Load workout state from localStorage
  const loadState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if state is recent (within 24 hours)
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading workout state:', error);
      return null;
    }
  }, []);

  // Clear saved workout state
  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      lastStateRef.current = null;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error clearing workout state:', error);
    }
  }, []);

  // Handle visibility change (app going to background/foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background - save state immediately
        if (workoutState && Object.keys(workoutState).length > 0) {
          try {
            const stateToSave = {
              ...workoutState,
              timestamp: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            lastStateRef.current = stateToSave;
          } catch (error) {
            console.error('Error saving state on visibility change:', error);
          }
        }
      } else {
        // App coming to foreground - restore state
        const savedState = loadState();
        if (savedState && onRestore) {
          onRestore(savedState);
        }
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      if (workoutState && Object.keys(workoutState).length > 0) {
        try {
          const stateToSave = {
            ...workoutState,
            timestamp: Date.now(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
          console.error('Error saving state on unload:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workoutState, loadState, onRestore]);

  // Auto-save when workoutState changes
  useEffect(() => {
    if (workoutState && Object.keys(workoutState).length > 0) {
      saveState(workoutState);
    }
  }, [workoutState, saveState]);

  return {
    saveState,
    loadState,
    clearState,
  };
}

export default useWorkoutPersistence;
