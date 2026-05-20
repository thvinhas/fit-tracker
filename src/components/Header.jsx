const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/80 backdrop-blur-xl">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-sm">
            <span className="text-zinc-950 font-extrabold text-sm">FT</span>
          </div>
          <span className="font-extrabold text-text-primary tracking-tight truncate text-lg">
            Fit Tracker
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
