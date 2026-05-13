import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  BoltIcon,
  ChartBarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  BoltIcon as BoltSolid,
  ChartBarIcon as ChartBarSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";

const isWorkoutTabActive = (pathname) =>
  pathname === "/workouts" ||
  pathname.startsWith("/workouts/") ||
  /^\/workout\//.test(pathname);

const tabs = [
  { to: "/", label: "Home", Outline: HomeIcon, Solid: HomeSolid },
  {
    to: "/workouts",
    label: "Treino",
    Outline: BoltIcon,
    Solid: BoltSolid,
    workout: true,
  },
  {
    to: "/progress",
    label: "Progresso",
    Outline: ChartBarIcon,
    Solid: ChartBarSolid,
  },
  { to: "/profile", label: "Perfil", Outline: UserIcon, Solid: UserSolid },
];

const MobileTabBar = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navegação principal"
    >
      <div className="max-w-lg mx-auto flex items-stretch justify-around h-16">
        {tabs.map(({ to, label, Outline, Solid, workout }) => {
          const active = workout
            ? isWorkoutTabActive(pathname)
            : to === "/"
              ? pathname === "/"
              : pathname === to || pathname.startsWith(`${to}/`);
          const Icon = active ? Solid : Outline;
          const cls = `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            active ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
          }`;
          return (
            <Link key={to} to={to} className={cls} aria-current={active ? "page" : undefined}>
              <Icon className="h-6 w-6" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
