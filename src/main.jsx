import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.jsx";

const updateSW = registerSW({
  immediate: true,

  onNeedRefresh() {
    const shouldUpdate = window.confirm(
      "Nova versão disponível. Atualizar agora?",
    );

    if (shouldUpdate) {
      updateSW(true);
    }
  },

  onOfflineReady() {
    console.log("App pronto para uso offline");
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
