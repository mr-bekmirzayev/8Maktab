import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { db, getFirebaseMessaging } from "../firebase";

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
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

  const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
  if (!vapidKey) {
    console.warn(
      "VITE_FCM_VAPID_KEY topilmadi. Push bildirishnomasi o'chiq qoladi."
    );
    return null;
  }

  try {
    const swReg = await registerServiceWorker();
    if (!swReg) return null;

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      return null;
    }

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

    return currentToken;
  } catch (error) {
    console.warn("FCM obunasida xatolik:", error);
    return null;
  }
}
