const Card = ({ children, className = "", highlighted = false }) => {
  return (
    <div
      className={`
        rounded-2xl transition-all duration-200
        ${
          highlighted
            ? "border border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_32px_-8px_rgba(52,211,153,0.25)]"
            : "border border-white/10 bg-white/[0.03] hover:border-white/15"
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
