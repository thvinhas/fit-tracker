const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/85 backdrop-blur-md">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_24px_-4px_rgba(52,211,153,0.45)]">
            <span className="text-zinc-950 font-bold text-sm">FT</span>
          </div>
          <span className="font-semibold text-zinc-100 tracking-tight truncate">
            Fit Tracker
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
