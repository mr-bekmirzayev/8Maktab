import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, getFirebaseMessaging } from "../firebase";

const FALLBACK_VAPID_KEY =
  "BNLL10-d-7gq37bn184KnKdRfvvhnR0n8E5eN_aRxj4X1IMegYC4oAca1v8KdI0Mps_e-svPYRD-f8XE4LoKRAA";

// Service worker manzili (public/sw.js). Nomini o'zgartirsangiz shu yerni ham yangilang.
const SW_PATH = "/sw.js";
const SW_SCOPE = "/";
const DEFAULT_ICON = "/icons/icon-192.png";
const TOKEN_TIMEOUT_MS = 15000;
const REQUEST_TIMEOUT_MS = 20000;

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Service worker ni ro'yxatdan o'tkazadi.
 * PWA offline rejimi va push bildirishnomalar uchun zarur.
 */
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE);

    // Eski firebase-messaging-sw.js registratsiyasi bo'lsa, uni yangi /sw.js bilan almashtiramiz
    if (existing && !String(existing.scriptURL || "").endsWith(SW_PATH)) {
      await existing.unregister().catch(() => {});
    }

    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: SW_SCOPE,
      updateViaCache: "none",
    });

    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.warn("Service Worker ro'yxatdan o'tkazishda xatolik:", error);
    return null;
  }
}

/**
 * Push obunasini yoqadi va FCM tokenni Firestore ga saqlaydi.
 *
 * MUHIM: brauzerlar (xususan Chrome) ruxsat oynasini faqat foydalanuvchi
 * bosgan tugma ichida ko'rsatishga ruxsat beradi. Shu sababli bu funksiya
 * o'zi ruxsat so'ramaydi — buning uchun enablePushNotifications() ishlatiladi.
 */
export async function subscribeToPushNotifications() {
  if (!isPushSupported()) {
    return null;
  }

  // Offline kesh har qanday holatda ishlashi uchun SW ni darhol ro'yxatdan o'tkazamiz
  const swReg = await registerServiceWorker();
  if (!swReg) return null;

  if (Notification.permission !== "granted") {
    return null;
  }

  const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY || FALLBACK_VAPID_KEY;

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn("FCM brauzer tomonidan qo'llab-quvvatlanmaydi.");
      return null;
    }

    const currentToken = await withTimeout(
      getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg,
      }),
      TOKEN_TIMEOUT_MS,
      "FCM token olish vaqti tugadi."
    );

    if (!currentToken) {
      console.warn("FCM token olinmadi.");
      return null;
    }

    try {
      // Tokenni xavfsiz doc ID sifatida formatlash (Firestore '/' ga ruxsat bermaydi)
      const safeDocId = "token_" + currentToken.replace(/[/]/g, "_");
      const tokenRef = doc(db, "fcm_tokens", safeDocId);

      await setDoc(
        tokenRef,
        {
          token: currentToken,
          userAgent: navigator.userAgent || "",
          platform: navigator.userAgentData?.platform || navigator.platform || "",
          language: navigator.language || "uz",
          enabled: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (saveError) {
      // Token olingan bo'lsa ham Firestore yozuvi muvaffaqiyatsiz bo'lishi mumkin.
      // Bu holda lokal push ishlashda davom etadi.
      console.warn("FCM tokenni saqlashda xatolik:", saveError);
    }

    console.log(
      "FCM token muvaffaqiyatli saqlandi:",
      currentToken.slice(0, 15) + "..."
    );
    return currentToken;
  } catch (error) {
    console.warn("FCM obunasida xatolik:", error);
    return null;
  }
}

/**
 * Foydalanuvchidan bildirishnoma ruxsatini so'raydi va push obunasini yoqadi.
 * Faqat click/touch hodisasi ichidan chaqirilishi kerak.
 *
 * @returns {Promise<{ok: boolean, permission: string, token?: string}>}
 */
export async function enablePushNotifications() {
  if (!isPushSupported()) {
    return { ok: false, permission: "unsupported" };
  }

  let permission = Notification.permission;

  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      console.warn("Ruxsat so'rashda xatolik:", error);
    }
  }

  if (permission !== "granted") {
    return { ok: false, permission };
  }

  const token = await subscribeToPushNotifications();
  return { ok: Boolean(token), permission, token: token || undefined };
}

/**
 * Sayt ochiq turganda lokal bildirishnoma ko'rsatadi.
 * Mobil brauzerlarda `new Notification()` ishlamaydi, shuning uchun SW ishlatiladi.
 */
export async function showLocalNotification(title, options = {}) {
  if (!isPushSupported() || Notification.permission !== "granted") return false;

  const notificationOptions = {
    icon: DEFAULT_ICON,
    badge: "/monochrome-96.png",
    tag: "8maktab-local",
    ...options,
  };

  try {
    const registration =
      (await navigator.serviceWorker.getRegistration(SW_SCOPE)) ||
      (await registerServiceWorker());

    if (registration) {
      await registration.showNotification(title, notificationOptions);
      return true;
    }
  } catch (error) {
    console.warn("Lokal bildirishnoma xatosi:", error);
  }

  return false;
}

/**
 * Yangi yangilik haqida bildirishnomaga ruxsat bergan BARCHA qurilmalarga
 * brauzer push xabarini yuboradi.
 *
 * Server (`/api/send-push`) `fcm_tokens` kolleksiyasidagi barcha aktiv
 * tokenlarni olib, ularga bir vaqtda xabar tarqatadi.
 *
 * @param {{ title: string, body?: string, url?: string, newsId?: string, image?: string }} payload
 * @returns {Promise<object|null>} Server javobi yoki xatolikda null
 */
export async function notifySubscribers({
  title,
  body,
  url = "/news",
  newsId = null,
  image = null,
} = {}) {
  if (!title) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let idToken = null;

    try {
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (tokenError) {
      console.warn("Push uchun ID token olinmadi:", tokenError);
    }

    const headers = { "Content-Type": "application/json" };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;

    const response = await fetch("/api/send-push", {
      method: "POST",
      headers,
      signal: controller.signal,
      keepalive: true,
      body: JSON.stringify({
        title,
        body: body || "",
        url,
        newsId,
        image,
      }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(json?.error || `Push server xatosi: ${response.status}`);
    }

    return json;
  } catch (error) {
    console.warn("Push yuborishda xatolik:", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
