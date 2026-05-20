const Card = ({ children, className = "", highlighted = false }) => {
  return (
    <div
      className={`
        rounded-2xl transition-all duration-300 relative overflow-hidden
        ${
          highlighted
            ? "bg-surface3 border border-primary/30 shadow-glow-sm before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:to-transparent before:pointer-events-none"
            : "bg-surface3 border-border-subtle hover:border-border-hover shadow-inner-glow"
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
