const NOTIFICATION_TAG = "treino-ativo";

export async function iniciarTreino() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
  if (Notification.permission === "denied") return;

  try {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    }
    if (Notification.permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Treino em andamento", {
      body: "Toque para voltar ao app",
      tag: NOTIFICATION_TAG,
      requireInteraction: true,
      silent: true,
      icon: "/icons/ft-icon.png",
    });
  } catch (error) {
    console.error("[workoutNotification] Falha ao mostrar notificação:", error);
  }
}

export async function fecharTreino() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({
      tag: NOTIFICATION_TAG,
    });
    notifications.forEach((notification) => notification.close());
  } catch (error) {
    console.error("[workoutNotification] Falha ao fechar notificação:", error);
  }
}
