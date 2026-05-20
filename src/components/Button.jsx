export const buttonPrimaryLinkClass =
  "font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.96] bg-gradient-primary text-black shadow-glow hover:shadow-glow-lg hover:scale-[1.02] px-5 py-4 text-base min-h-[56px] w-full relative overflow-hidden group";

export const buttonGhostLinkClass =
  "font-bold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 active:scale-[0.96] text-text-tertiary hover:text-text-secondary hover:bg-white/5 px-3 py-2 text-sm";

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
    "font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.95] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 disabled:hover:scale-100 relative overflow-hidden";

  const variants = {
    primary:
      "bg-gradient-primary text-black shadow-glow hover:shadow-glow-lg hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
    secondary:
      "bg-surface3 text-text-primary border-border-subtle hover:bg-surface4 hover:border-border-hover shadow-inner-glow",
    danger:
      "bg-red-500/90 text-white hover:bg-red-500 shadow-lg hover:shadow-red-500/30",
    ghost: "text-text-tertiary hover:text-text-secondary hover:bg-white/5",
  };

  const sizes = {
    sm: "px-4 py-2.5 text-sm rounded-xl",
    md: "px-5 py-3 text-sm rounded-xl",
    lg: "px-6 py-4 text-[22px] font-bold min-h-[64px] w-full rounded-2xl",
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
  "font-bold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 active:scale-[0.96] bg-surface3 text-text-primary border-border-subtle hover:bg-surface4 hover:border-border-hover shadow-inner-glow px-4 py-3 text-sm w-full";

export default Button;
