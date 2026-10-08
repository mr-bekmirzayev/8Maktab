// Immediate activation on install and update
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Scripts for Firebase App and Messaging (compat libraries)
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Initialize Firebase with the same config as src/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyAUs12XGEnXKe7haVon5p3CeFzZVYFdhDs",
  authDomain: "schoolnews-cd298.firebaseapp.com",
  projectId: "schoolnews-cd298",
  storageBucket: "schoolnews-cd298.firebasestorage.app",
  messagingSenderId: "831246809354",
  appId: "1:831246809354:web:3dc84f9ceebce81e8d62f3",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages via Firebase SDK
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Fon xabari qabul qilindi:", payload);

  const notificationTitle =
    payload.notification?.title || payload.data?.title || "8-Maktab";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    icon:
      payload.notification?.icon ||
      payload.data?.icon ||
      "/SchoolTitleFor.png",
    badge: "/SchoolTitleFor.png",
    vibrate: [200, 100, 200],
    data: {
      url: payload.fcmOptions?.link || payload.data?.url || "/news",
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Fallback push event: agar xabar sof push yoki FCM SDK chaqirilmay qolganda ham xabar chiqishi uchun
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    // Faqat data bo'lsa yoki notification FCM SDK orqali ishlamay qolsa
    if (!data.notification && data.data) {
      const title = data.data.title || "8-Maktab";
      const options = {
        body: data.data.body || "",
        icon: data.data.icon || "/SchoolTitleFor.png",
        badge: "/SchoolTitleFor.png",
        vibrate: [200, 100, 200],
        data: { url: data.data.url || "/news" },
      };
      event.waitUntil(self.registration.showNotification(title, options));
    }
  } catch (err) {
    const text = event.data.text();
    if (text) {
      event.waitUntil(
        self.registration.showNotification("8-Maktab", {
          body: text,
          icon: "/SchoolTitleFor.png",
          badge: "/SchoolTitleFor.png",
          data: { url: "/news" },
        })
      );
    }
  }
});

// Handle notification click to open or focus site
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/news";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});