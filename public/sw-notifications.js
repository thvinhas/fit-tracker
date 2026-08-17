// Loaded into the generated service worker via workbox `importScripts`.
// Handles clicks on the "treino em andamento" notification.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const client = clientsArr.find((c) => "focus" in c);
        if (client) return client.focus();
        return self.clients.openWindow("/");
      }),
  );
});
