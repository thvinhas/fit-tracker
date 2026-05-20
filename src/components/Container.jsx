const Container = ({ children, title, subtitle, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-base text-text-tertiary leading-relaxed font-medium">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Container;
