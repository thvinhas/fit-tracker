export const buttonPrimaryLinkClass =
  "font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-[0_0_28px_-6px_rgba(52,211,153,0.55)] hover:from-emerald-400 hover:to-teal-400 px-5 py-3.5 text-base min-h-[52px] w-full";

export const buttonGhostLinkClass =
  "font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 active:scale-[0.98] text-zinc-300 hover:bg-white/5 px-3 py-2 text-sm";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  type = "button",
  ...props
}) => {
  const baseClasses =
    "font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100";

  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-[0_0_28px_-6px_rgba(52,211,153,0.55)] hover:from-emerald-400 hover:to-teal-400",
    secondary:
      "bg-white/10 text-zinc-100 border border-white/10 hover:bg-white/[0.14]",
    danger: "bg-red-500/90 text-white hover:bg-red-500",
    ghost: "text-zinc-300 hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3.5 text-base min-h-[52px] w-full",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export const buttonSecondaryLinkClass =
  "font-semibold rounded-xl transition-all inline-flex items-center justify-center gap-2 active:scale-[0.98] bg-white/10 text-zinc-100 border border-white/10 hover:bg-white/[0.14] px-3 py-2 text-sm w-full";

export default Button;
