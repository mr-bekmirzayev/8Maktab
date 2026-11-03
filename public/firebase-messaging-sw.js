/* =============================================================================
   firebase-messaging-sw.js
   Firebase Cloud Messaging (FCM) uchun service worker.

   Bu fayl MUSTAQIL ishlatilmaydi: u /sw.js ichidan importScripts qilinadi.
   Shu tufayli saytda faqat bitta service worker ro'yxatdan o'tadi.
============================================================================= */

// Yangilanish darhol kuchga kirishi uchun
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const DEFAULT_ICON = "/icons/icon-192.png";
const DEFAULT_BADGE = "/monochrome-96.png";
const DEFAULT_URL = "/news";

function toAbsoluteUrl(path) {
  try {
    return new URL(path || DEFAULT_URL, self.location.origin).href;
  } catch {
    return new URL(DEFAULT_URL, self.location.origin).href;
  }
}

function showNotification(title, body, icon, url, tag, image) {
  return self.registration.showNotification(title || "8-Maktab", {
    body: body || "",
    icon: icon || DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    image: image || undefined,
    vibrate: [150, 80, 150],
    tag: tag || "8maktab-news",
    renotify: true,
    requireInteraction: false,
    data: { url: toAbsoluteUrl(url), dateOfArrival: Date.now() },
    actions: [
      { action: "open", title: "Yangilikni o'qish" },
      { action: "close", title: "Yopish" },
    ],
  });
}

/* ─── Firebase Messaging SDK ──────────────────────────────────────────────
   SDK yuklanmasa ham (masalan, tarmoq bloklangan bo'lsa) oddiy Push API
   orqali xabar ko'rsatishda davom etamiz.
──────────────────────────────────────────────────────────────────────── */
let fcmReady = false;

try {
  // Firebase App va Messaging (compat) kutubxonalari
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

  // src/firebase.js dagi konfiguratsiya bilan bir xil bo'lishi kerak
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

  // Server data-only xabar yuboradi, shuning uchun xabarni o'zimiz ko'rsatamiz.
  // Agar notification payload ishlatilsa, SDK uni o'zi ko'rsatadi (dublikat bo'lmasin).
  messaging.onBackgroundMessage((payload) => {
    if (payload?.notification) return;

    const data = payload?.data || {};
    return showNotification(
      data.title || "8-Maktab",
      data.body || "",
      data.icon || DEFAULT_ICON,
      data.url || payload?.fcmOptions?.link || DEFAULT_URL,
      data.tag || `news-${data.newsId || Date.now()}`,
      data.image || undefined
    );
  });

  fcmReady = true;
} catch (error) {
  console.warn(
    "[firebase-messaging-sw] FCM SDK yuklanmadi, oddiy Push API ishlatiladi:",
    error
  );
}

/* ─── Push event (zaxira qatlam) ──────────────────────────────────────────
   FCM SDK mavjud bo'lsa, xabar onBackgroundMessage orqali ko'rsatiladi.
   SDK yuklanmagan bo'lsa, xabar shu yerda ko'rsatiladi.
──────────────────────────────────────────────────────────────────────── */
self.addEventListener("push", (event) => {
  if (fcmReady || !event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    const text = event.data.text?.() || "";
    if (text) {
      event.waitUntil(
        showNotification("8-Maktab", text, DEFAULT_ICON, DEFAULT_URL)
      );
    }
    return;
  }

  const data = payload?.data || payload || {};
  const title = data.title || payload?.notification?.title || "8-Maktab";
  const body = data.body || payload?.notification?.body || "";
  const icon = data.icon || payload?.notification?.icon || DEFAULT_ICON;
  const url = data.url || payload?.fcmOptions?.link || DEFAULT_URL;
  const tag = data.tag || `news-${data.newsId || Date.now()}`;

  event.waitUntil(
    showNotification(title, body, icon, url, tag, data.image || undefined)
  );
});

/* ─── Bildirishnomaga bosilganda ─────────────────────────────────────────── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl = toAbsoluteUrl(event.notification?.data?.url);
  const target = new URL(targetUrl);

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === target.origin) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl);
            } catch {
              /* navigatsiya qo'llab-quvvatlanmasa e'tiborsiz qoldiramiz */
            }
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
