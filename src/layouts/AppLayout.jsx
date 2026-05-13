import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import MobileTabBar from "../components/MobileTabBar";

const SESSION_PATH = /\/workout\/[^/]+\/start$/;

const AppLayout = () => {
  const { pathname } = useLocation();
  const sessionMode = SESSION_PATH.test(pathname);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col">
      {!sessionMode && <Header />}
      <main
        className={`flex-1 w-full max-w-lg mx-auto px-4 ${sessionMode ? "pb-8 pt-2" : "pb-24 pt-2"}`}
      >
        <Outlet />
      </main>
      {!sessionMode && <MobileTabBar />}
    </div>
  );
};

export default AppLayout;
