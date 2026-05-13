const Container = ({ children, title, subtitle, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Container;
