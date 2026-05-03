const Checkbox = ({ label, checked, onChange, disabled = false }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span
        className={`text-sm font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;
