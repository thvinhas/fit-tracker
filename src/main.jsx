import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initNative, isNativePlatform } from "./native.js";

// PWA/Service Worker só faz sentido na web. No app nativo (Capacitor/iOS)
// os assets já são empacotados, então pulamos o registro do SW.
if (!isNativePlatform()) {
  import("virtual:pwa-register").then(({ registerSW }) => {
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
  });
}

// Inicializa integrações nativas (StatusBar, SplashScreen, Keyboard, etc).
initNative();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
