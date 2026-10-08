import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { db, getFirebaseMessaging } from "../firebase";

const FALLBACK_VAPID_KEY =
  "BNLL10-d-7gq37bn184KnKdRfvvhnR0n8E5eN_aRxj4X1IMegYC4oAca1v8KdI0Mps_e-svPYRD-f8XE4LoKRAA";

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
    // Service Worker faol bo'lishini kutish
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.warn("Service Worker ro'yxatdan o'tkazishda xatolik:", error);
    return null;
  }
}

export async function subscribeToPushNotifications() {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return null;
  }

  const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY || FALLBACK_VAPID_KEY;

  try {
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      return null;
    }

    const swReg = await registerServiceWorker();
    if (!swReg) return null;

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn("FCM brauzer tomonidan qo'llab-quvvatlanmaydi.");
      return null;
    }

    const currentToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });

    if (!currentToken) {
      console.warn("FCM token olinmadi.");
      return null;
    }

    // Tokenni xavfsiz doc ID sifatida formatlash (Firestore '/' ga ruxsat bermaydi)
    const safeDocId = "token_" + currentToken.replace(/[/]/g, "_");
    const tokenRef = doc(db, "fcm_tokens", safeDocId);

    await setDoc(
      tokenRef,
      {
        token: currentToken,
        userAgent: navigator.userAgent || "",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("FCM token muvaffaqiyatli saqlandi:", currentToken.slice(0, 15) + "...");
    return currentToken;
  } catch (error) {
    console.warn("FCM obunasida xatolik:", error);
    return null;
  }
}
