import { useEffect, useRef, useState } from "react";
import { getExerciseLibrary } from "../services/firestore";

const MAX_SUGGESTIONS = 8;

const ExercisePicker = ({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  size = "md",
}) => {
  const [library, setLibrary] = useState(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    getExerciseLibrary().then(setLibrary);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const term = value.trim().toLowerCase();
  const suggestions =
    term.length > 0 && library
      ? library
          .filter((ex) => ex.name.toLowerCase().includes(term))
          .slice(0, MAX_SUGGESTIONS)
      : [];

  const handleSelect = (exercise) => {
    onSelect(exercise);
    setOpen(false);
  };

  const inputSizeClass =
    size === "lg" ? "px-5 py-4 text-lg font-semibold" : "px-4 py-3.5 text-base";
  const labelSizeClass = size === "lg" ? "text-sm mb-2.5" : "text-xs mb-2";

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label
          className={`block font-bold text-text-muted uppercase tracking-wider ${labelSizeClass}`}
        >
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required
        className={`w-full rounded-2xl border transition-all duration-300
          bg-surface2 text-text-primary placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
          border-border-subtle hover:border-border-hover ${inputSizeClass}`}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-border-subtle bg-surface2 shadow-lg overflow-hidden">
          <ul className="max-h-72 overflow-y-auto">
            {suggestions.map((exercise) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(exercise)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface4 transition-colors"
                >
                  {exercise.imageUrl && (
                    <img
                      src={exercise.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {exercise.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {exercise.muscleGroup} · {exercise.equipment}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <p className="px-4 py-2 text-[10px] text-text-muted border-t border-border-subtle">
            Imagens © Gym visual — gymvisual.com
          </p>
        </div>
      )}
    </div>
  );
};

export default ExercisePicker;
