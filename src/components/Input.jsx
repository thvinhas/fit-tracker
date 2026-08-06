const sizes = {
  md: { label: "text-xs mb-2", input: "px-4 py-3.5 text-base" },
  lg: { label: "text-sm mb-2.5", input: "px-5 py-4 text-lg font-semibold" },
};

const Input = ({ label, error, size = "md", className = "", ...props }) => {
  const sizeClasses = sizes[size] || sizes.md;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          className={`block font-bold text-text-muted uppercase tracking-wider ${sizeClasses.label}`}
        >
          {label}
        </label>
      )}
      <input
        className={`
          w-full rounded-2xl border transition-all duration-300
          bg-surface2 text-text-primary placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
          ${sizeClasses.input}
          ${error ? "border-red-500/60 focus:ring-red-500/50" : "border-border-subtle hover:border-border-hover"}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Input;
