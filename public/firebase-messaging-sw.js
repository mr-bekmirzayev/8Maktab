// Firebase Messaging Service Worker (Fonda va Tab yopiq bo'lganda ham ishlaydi)
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyAUs12XGEnXKe7haVon5p3CeFzZVYFdhDs",
  authDomain: "schoolnews-cd298.firebaseapp.com",
  projectId: "schoolnews-cd298",
  storageBucket: "schoolnews-cd298.firebasestorage.app",
  messagingSenderId: "831246809354",
  appId: "1:831246809354:web:3dc84f9ceebce81e8d62f3",
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.log("Firebase SW messaging init:", e);
}

// 1. Firebase Background Message qabul qiluvchi
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log("[SW] Fonda xabar keldi:", payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || "8-Maktab Yangiliklari";
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || payload.data?.description || "Maktabimizda yangi yangilik e'lon qilindi.",
      icon: payload.notification?.icon || payload.data?.icon || "/SchoolTitleFor.png",
      badge: "/SchoolTitleFor.png",
      data: {
        url: payload.data?.url || "/news",
      },
      vibrate: [200, 100, 200],
      tag: payload.data?.id || "school-news-" + Date.now(),
      renotify: true,
      requireInteraction: false,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// 2. Standart Web Push hodisasini to'g'ridan-to'g'ri ushlab ko'rsatish
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const notificationTitle = data.notification?.title || data.title || "8-Maktab: Yangi xabar! 🔔";
  const notificationOptions = {
    body: data.notification?.body || data.body || data.description || "Yangi maktab yangiligi e'lon qilindi. O'qish uchun bosing!",
    icon: data.notification?.icon || data.icon || "/SchoolTitleFor.png",
    badge: "/SchoolTitleFor.png",
    data: {
      url: data.data?.url || data.url || "/news",
    },
    vibrate: [200, 100, 200],
    tag: data.id || "school-news-" + Date.now(),
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// 3. Bildirishnoma bosilganda sahifani ochish
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/news";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Agar ochiq vkladka bo'lsa unga o'tamiz
      for (let client of windowClients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Agar sayt yopiq bo'lsa yangi oynada ochamiz
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Service worker faollashishi
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
