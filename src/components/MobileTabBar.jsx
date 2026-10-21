import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { navTabs, isTabActive } from "./navTabs";

const MobileTabBar = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border-subtle bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navegação principal"
    >
      <div className="max-w-lg mx-auto flex items-stretch justify-around h-18">
        {navTabs.map((tab) => {
          const { to, label, Outline, Solid } = tab;
          const active = isTabActive(pathname, tab);
          const Icon = active ? Solid : Outline;
          const cls = `flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
            active ? "text-primary" : "text-text-muted hover:text-text-tertiary"
          }`;
          return (
            <motion.div key={to} whileTap={{ scale: 0.95 }} className="flex-1">
              <Link
                to={to}
                className={cls}
                aria-current={active ? "page" : undefined}
              >
                <motion.div
                  animate={{
                    scale: active ? 1.15 : 1,
                    y: active ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon className="h-7 w-7" aria-hidden />
                </motion.div>
                <span>{label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
