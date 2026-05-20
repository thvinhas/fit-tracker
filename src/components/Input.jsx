const Input = ({ label, error, className = "", ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3.5 rounded-2xl border transition-all duration-300
          bg-surface2 text-text-primary placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
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
