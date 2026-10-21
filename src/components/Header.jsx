import { Link, useLocation } from "react-router-dom";
import { navTabs, isTabActive } from "./navTabs";

const Header = () => {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/80 backdrop-blur-xl">
      <div className="max-w-lg lg:max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-sm">
            <span className="text-zinc-950 font-extrabold text-sm">FT</span>
          </div>
          <span className="font-extrabold text-text-primary tracking-tight truncate text-lg">
            Fit Tracker
          </span>
        </div>

        <nav
          className="hidden lg:flex items-center gap-1"
          aria-label="Navegação principal"
        >
          {navTabs.map((tab) => {
            const active = isTabActive(pathname, tab);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-white/5"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
