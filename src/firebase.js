import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyAUs12XGEnXKe7haVon5p3CeFzZVYFdhDs",
  authDomain: "schoolnews-cd298.firebaseapp.com",
  projectId: "schoolnews-cd298",
  storageBucket: "schoolnews-cd298.firebasestorage.app",
  messagingSenderId: "831246809354",
  appId: "1:831246809354:web:3dc84f9ceebce81e8d62f3",
};

export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const auth = getAuth(app);

// Messaging instansiyasini xavfsiz yuklash
export const getFirebaseMessaging = async () => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window) {
    try {
      const supported = await isSupported();
      if (supported) {
        return getMessaging(app);
      }
    } catch (e) {
      console.warn("Firebase messaging qo'llab-quvvatlanmadi:", e);
    }
  }
  return null;
};
