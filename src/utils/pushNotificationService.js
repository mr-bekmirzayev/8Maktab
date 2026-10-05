import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging, db } from "../firebase";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";

const TOKEN_STORAGE_KEY = "fcm_push_token_v1";

/**
 * Service Worker ni ro'yxatdan o'tkazish
 */
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    return registration;
  } catch (err) {
    console.warn("Service Worker ro'yxatdan o'tmadi:", err);
    return null;
  }
}

/**
 * Push bildirishnomalariga obuna bo'lish va tokenni saqlash
 */
export async function subscribeToPushNotifications() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { success: false, reason: "unsupported" };
  }

  try {
    // 1. Service Worker ni ro'yxatdan o'tkazamiz
    const swReg = await registerServiceWorker();

    // 2. Ruxsat so'raymiz
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, reason: permission };
    }

    // 3. Firebase Messaging orqali Token olish
    const messaging = await getFirebaseMessaging();
    let token = null;

    if (messaging && swReg) {
      try {
        token = await getToken(messaging, {
          serviceWorkerRegistration: swReg,
        });
      } catch (fcmErr) {
        console.warn("FCM getToken xatosi:", fcmErr);
      }
    }

    // Agar token ololgan bo'lsa, uni Firestore ga saqlaymiz
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);

      // Firestore dagi fcm_tokens kolleksiyasiga saqlaymiz
      // Token uzun string bo'lgani uchun xavfsiz ID yaratamiz yoki to'g'ridan-to'g'ri saqlaymiz
      const tokenDocId = token.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
      await setDoc(
        doc(db, "fcm_tokens", tokenDocId),
        {
          token: token,
          userAgent: navigator.userAgent || "",
          platform: navigator.platform || "",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return { success: true, token, permission };
  } catch (error) {
    console.error("Push obunasida xatolik:", error);
    return { success: false, reason: error.message };
  }
}

/**
 * Admin yangi yangilik qo'shganda barcha qurilmalarga Push yuborish
 */
export async function broadcastPushNotification({ title, body, icon, url, id }) {
  const payload = {
    title: title || "8-Maktab: Yangi yangilik!",
    body: body || "Maktabimizda yangi xabar e'lon qilindi.",
    icon: icon || "/SchoolTitleFor.png",
    url: url || "/news",
    id: String(id || Date.now()),
  };

  try {
    // 1. Vercel / Backend API orqali yuborish
    const response = await fetch("/api/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("Push xabarnoma barcha qurilmalarga yuborildi!");
      return true;
    }
  } catch (err) {
    console.warn("Serverless push API chaqirishda xatolik:", err);
  }

  // Fallback: Firestore notifications kolleksiyasiga yozib qo'yish
  try {
    await setDoc(doc(db, "push_broadcasts", String(Date.now())), {
      ...payload,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {}

  return false;
}
