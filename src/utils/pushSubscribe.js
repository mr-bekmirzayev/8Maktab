// src/utils/pushSubscribe.js
// Tashrifchidan bildirishnoma ruxsatini so'raydi va Firestore'ga obuna yozadi.

import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

// VAPID public key - Vite muhit o'zgaruvchisidan olinadi (.env.local va Vercel'da
// VITE_VAPID_PUBLIC_KEY nomi bilan saqlanadi, chunki brauzerga yuboriladigan
// o'zgaruvchilar Vite'da albatta "VITE_" bilan boshlanishi SHART).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush() {
  // Brauzer push'ni qo'llamasa (juda eski brauzer), jimgina chiqib ketamiz
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }
  if (!VAPID_PUBLIC_KEY) {
    console.warn("VITE_VAPID_PUBLIC_KEY topilmadi, push o'chirilgan holda qoladi.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw-push.js");

    // Avval ruxsat so'ralmagan bo'lsa - so'raymiz
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return; // foydalanuvchi rad etdi

    // Allaqachon obuna bo'lgan bo'lsa, qayta yozmaymiz
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Takrorlanmasligi uchun endpoint'ni "key" sifatida saqlaymiz (oddiy himoya)
    const subJson = subscription.toJSON();
    const existing = localStorage.getItem("push_subscribed_endpoint");
    if (existing === subJson.endpoint) return; // bu qurilma allaqachon Firestore'da bor

    await addDoc(collection(db, "pushSubscriptions"), {
      ...subJson,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("push_subscribed_endpoint", subJson.endpoint);
  } catch (err) {
    console.error("Push obuna xatosi:", err);
  }
}
