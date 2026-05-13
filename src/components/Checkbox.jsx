const Checkbox = ({ label, checked, onChange, disabled = false }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-5 h-5 rounded-md border-white/20 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      />
      <span
        className={`text-sm font-medium ${disabled ? "text-zinc-600" : "text-zinc-300"}`}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;
