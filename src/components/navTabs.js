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

export const isWorkoutTabActive = (pathname) =>
  pathname === "/workouts" ||
  pathname.startsWith("/workouts/") ||
  /^\/workout\//.test(pathname);

export const navTabs = [
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

export const isTabActive = (pathname, tab) =>
  tab.workout
    ? isWorkoutTabActive(pathname)
    : tab.to === "/"
      ? pathname === "/"
      : pathname === tab.to || pathname.startsWith(`${tab.to}/`);
