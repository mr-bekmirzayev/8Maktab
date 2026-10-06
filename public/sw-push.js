// public/sw-push.js
// Sayt yopiq bo'lsa ham push-bildirishnoma ko'rsatadigan Service Worker.

self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Yangilik", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "8-Maktab";
  const options = {
    body: data.body || "",
    icon: "/SchoolTitleFor.png",
    badge: "/SchoolTitleFor.png",
    data: { url: data.url || "/news" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
