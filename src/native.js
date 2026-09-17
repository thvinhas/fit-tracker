import { Capacitor } from "@capacitor/core";

/**
 * Inicializa recursos nativos quando o app roda dentro do Capacitor (iOS).
 * Em ambiente web (navegador/PWA) nada é executado.
 */
export const isNativePlatform = () => Capacitor.isNativePlatform();

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;

  // Marca o documento como app nativo para ajustes de CSS específicos.
  document.documentElement.classList.add("capacitor-native");
  document.documentElement.classList.add(`platform-${Capacitor.getPlatform()}`);

  const [{ StatusBar, Style }, { SplashScreen }, { Keyboard }, { App }] =
    await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
      import("@capacitor/keyboard"),
      import("@capacitor/app"),
    ]);

  // Barra de status: tema escuro, sobreposta ao conteúdo (usamos safe-area no CSS).
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // StatusBar pode não estar disponível em alguns contextos.
  }

  // Ajusta a tela para o teclado do iOS.
  try {
    Keyboard.addListener("keyboardWillShow", () => {
      document.body.classList.add("keyboard-open");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.body.classList.remove("keyboard-open");
    });
  } catch {
    // Keyboard indisponível.
  }

  // Botão físico "voltar" (iOS usa gesto, mas mantemos por segurança/iPad).
  try {
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch {
    // App plugin indisponível.
  }

  // Esconde o splash quando o app já montou.
  try {
    await SplashScreen.hide();
  } catch {
    // SplashScreen indisponível.
  }
}

/**
 * Dispara um feedback tátil leve (no-op na web).
 */
export async function haptic(style = "light") {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] ?? ImpactStyle.Light });
  } catch {
    // Haptics indisponível.
  }
}
