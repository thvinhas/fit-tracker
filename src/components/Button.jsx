const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400",
    secondary:
      "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400",
    ghost: "text-gray-700 hover:bg-gray-100 disabled:text-gray-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg w-full",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
