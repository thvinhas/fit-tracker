const Input = ({ label, error, className = "", ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-xl border transition-all duration-200
          bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-600
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
          ${error ? "border-red-500/60" : "border-white/10 hover:border-white/20"}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default Input;
