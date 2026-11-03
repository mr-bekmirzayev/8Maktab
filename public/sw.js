/* =============================================================================
   8-Maktab — Service Worker (PWA + offline + push)

   - Sayt qobig'ini (app shell) keshga oladi va internet yo'q bo'lsa ham ochadi.
   - Firebase Cloud Messaging (FCM) push xabarlarini qabul qiladi.
   - FCM logikasi firebase-messaging-sw.js dan import qilinadi (bitta worker).

   MUHIM: bu faylning nomi yoki joyi o'zgarsa,
   src/utils/pushNotificationService.js dagi SW_PATH ni ham yangilang.
============================================================================= */

importScripts("/firebase-messaging-sw.js");

const CACHE_VERSION = "8maktab-v4";
const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/favicon-32.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

/* ─── O'rnatish: kerakli fayllarni keshga olish ─────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.allSettled(
        APP_SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" }))
        )
      );
      await self.skipWaiting();
    })()
  );
});

/* ─── Faollashtirish: eski keshlarni tozalash ───────────────────────────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/* ─── So'rovlarni keshlash strategiyalari ───────────────────────────────── */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Faqat o'z domenimiz va API bo'lmagan so'rovlar
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Sahifa navigatsiyasi: avval internet, keyin kesh (offline fallback)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (fresh && fresh.ok) {
            const cache = await caches.open(CACHE_VERSION);
            await cache.put("/index.html", fresh.clone());
          }
          return fresh;
        } catch {
          const cache = await caches.open(CACHE_VERSION);
          return (
            (await cache.match("/index.html")) ||
            (await cache.match("/offline.html")) ||
            new Response("Offline", { status: 503, statusText: "Offline" })
          );
        }
      })()
    );
    return;
  }

  // Statik fayllar: avval kesh, fonda yangilash (stale-while-revalidate)
  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    /\.(?:css|js|mjs|png|jpe?g|webp|avif|svg|ico|woff2?|ttf|otf|json|xml)$/i.test(
      url.pathname
    );

  if (!isStaticAsset) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(request);

      if (cached) {
        fetch(request)
          .then(async (response) => {
            if (response && response.ok) {
              await cache.put(request, response.clone());
            }
          })
          .catch(() => {});
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response && response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (
          cached ||
          new Response("", { status: 504, statusText: "Offline" })
        );
      }
    })()
  );
});
