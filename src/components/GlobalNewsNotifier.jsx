import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoNotifications, IoClose, IoChevronForward, IoInformationCircle } from "react-icons/io5";

// JSONBin o'chirilmagan, faqat ishlatilmaydigan holatga keltirilgan:
// import { fetchWithJsonbinCache } from "../utils/jsonbinCache";
// const BIN_ID = "6ab11f8effd5d160531f39ea";
// const MASTER_KEY = "$2a$10$P2EP5iL5TTjPvxXdGmgRJeZ0SuAQRZpwWmOWJV5dLBWuS791xj2jm";

import { fetchNewsFromFirestore } from "../utils/firestoreService";
import { FiLock } from "react-icons/fi";
import { subscribeToPushNotifications } from "../utils/pushNotificationService";

const NOTIFIED_IDS_KEY = "notified_news_ids_v2";
const CHECK_INTERVAL_MS = 1 * 60 * 1000; // Har 10 daqiqada tejamkor kesh tekshiruvi

// Yoqimli bildirishnoma tovushini chiqarish (Web Audio API)
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 1-ohang
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // 2-ohang
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (e) {
    // Autoplay cheklovi bo'lsa to'xtab qolmasligi uchun
  }
}

// Brauzer va Telefon uchun Push Notification yuborish
function sendSystemNotification(item, onOpenNews) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title = item.title || item.sarlavha || "8-Maktab: Yangi xabar!";
  const body = item.description || item.tavsif || item.content || "Maktabimizda yangi yangilik e'lon qilindi.";
  const icon = item.image || item.rasm || "/schoolLogo.png";

  try {
    const notif = new Notification(title, {
      body: body.length > 120 ? body.slice(0, 117) + "..." : body,
      icon: icon,
      badge: icon,
      tag: String(item.id || item._id || Date.now()),
      requireInteraction: false,
    });

    notif.onclick = () => {
      window.focus();
      if (onOpenNews) onOpenNews();
      notif.close();
    };
  } catch (err) {
    console.warn("Notification error:", err);
  }
}

export default function GlobalNewsNotifier() {
  const navigate = useNavigate();
  const [toastNews, setToastNews] = useState(null);
  const [permissionState, setPermissionState] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission; // "default", "granted", "denied"
    }
    return "unsupported";
  });
  
  // Banner yopilganligini seans davomida eslab turish
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDeniedModal, setShowDeniedModal] = useState(false);
  const isFirstRun = useRef(true);

  // Ruxsat so'rash (Callback + Promise va Denied holatlarini to'liq qo'llab-quvvatlaydi)
  const handleAskPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Qurilmangiz yoki brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi.");
      return;
    }

    if (Notification.permission === "denied") {
      setShowDeniedModal(true);
      return;
    }

    try {
      let finalResult = Notification.permission;

      // Promise + Callback qo'llab-quvvatlovi (Mobil va barcha brauzerlar uchun)
      const requestRes = Notification.requestPermission((res) => {
        if (res) {
          finalResult = res;
          setPermissionState(res);
          if (res === "granted") {
            subscribeToPushNotifications();
            try {
              new Notification("Bildirishnomalar yoqildi! 🔔", {
                body: "Maktabimizning yangi xabarlaridan birinchilardan bo'lib boxabar bo'lasiz.",
                icon: "/schoolLogo.png"
              });
            } catch (e) {}
          } else if (res === "denied") {
            setShowDeniedModal(true);
          }
        }
      });

      if (requestRes && typeof requestRes.then === "function") {
        finalResult = await requestRes;
        setPermissionState(finalResult);
        if (finalResult === "granted") {
          subscribeToPushNotifications();
          try {
            new Notification("Bildirishnomalar yoqildi! 🔔", {
              body: "Maktabimizning yangi xabarlaridan birinchilardan bo'lib boxabar bo'lasiz.",
              icon: "/schoolLogo.png"
            });
          } catch (e) {}
        } else if (finalResult === "denied") {
          setShowDeniedModal(true);
        }
      }
    } catch (e) {
      console.warn("Permission error:", e);
      if (Notification.permission === "denied") {
        setShowDeniedModal(true);
      }
    }
  };

  useEffect(() => {
    const checkNews = async () => {
      // Tab yoqilmagan bo'lsa fonda ortiqcha so'rov yubormaymiz
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const cacheResult = await fetchNewsFromFirestore({
          ttlMs: CHECK_INTERVAL_MS,
        });

        const record = cacheResult?.data;
        if (!record) return;

        // Firestore dan kelgan ma'lumot to'g'ridan-to'g'ri massiv
        let items = [];
        if (Array.isArray(record)) {
          items = record;
        } else if (Array.isArray(record?.news)) {
          items = record.news;
        } else if (Array.isArray(record?.yangiliklar)) {
          items = record.yangiliklar;
        } else if (record && typeof record === "object") {
          items = [record];
        }

        if (items.length === 0) return;

        // Oldin xabar berilgan ID lar
        const stored = localStorage.getItem(NOTIFIED_IDS_KEY);
        let notifiedIds = stored ? JSON.parse(stored) : null;

        // Agar birinchi marta bo'lsa, mavjudlarini saqlab qo'yamiz
        if (!notifiedIds) {
          notifiedIds = items.map((it, idx) => String(it.id ?? it.title ?? idx));
          localStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(notifiedIds));
          isFirstRun.current = false;
          return;
        }

        const notifiedSet = new Set(notifiedIds.map(String));

        // Yangi qo'shilgan yangiliklarni topamiz
        const brandNewItems = items.filter((it, idx) => {
          const key = String(it.id ?? it.title ?? idx);
          return !notifiedSet.has(key);
        });

        if (brandNewItems.length > 0) {
          const latestNew = brandNewItems[brandNewItems.length - 1];

          // 1. Ovoz chiqarish
          playNotificationSound();

          // 2. Brauzer/Telefon Push Notification
          sendSystemNotification(latestNew, () => navigate("/news"));

          // 3. Sayt ichidagi Toast Popup banner
          setToastNews(latestNew);

          // 4. Barcha yangi ID larni saqlab qo'yish
          const updatedIds = [
            ...notifiedIds,
            ...brandNewItems.map((it, idx) => String(it.id ?? it.title ?? idx)),
          ];
          localStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(updatedIds));
        }

        isFirstRun.current = false;
      } catch (err) {
        console.warn("Global news check xatosi:", err);
      }
    };

    // Darhol tekshirish
    checkNews();

    // Har 10 daqiqada fonda tejamkor tekshirib turish
    const intervalId = setInterval(checkNews, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [navigate]);

  // Agar ruxsat berilmagan bo'lsa (default yoki denied bo'lsa ham) va foydalanuvchi yopmagan bo'lsa banner HAR DOIM KO'RINADI
  const isBannerVisible =
    typeof window !== "undefined" &&
    "Notification" in window &&
    permissionState !== "granted" &&
    !isDismissed;

  return (
    <>
      {/* 1. Bildirishnoma ruxsat berish taklifi banneri (O'zi yo'qolmaydi, doimiy eslatib turadi) */}
      {isBannerVisible && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(249, 115, 22, 0.45)",
            borderRadius: "18px",
            padding: "14px 18px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(249, 115, 22, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "min(460px, calc(100vw - 32px))",
          }}
        >
          <div
            style={{
              background: "rgba(249, 115, 22, 0.2)",
              padding: "10px",
              borderRadius: "12px",
              color: "#fb923c",
              display: "flex",
              flexShrink: 0,
            }}
          >
            <IoNotifications size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#f8fafc" }}>
              Yangi xabarlardan boxabar bo'ling!
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Maktab yangiliklarini qurilmangizda qabul qiling.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAskPermission}
            style={{
              background: "linear-gradient(135deg, #ea580c, #f97316)",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "0 2px 10px rgba(249, 115, 22, 0.35)",
              transition: "transform 0.2s ease",
            }}
          >
            Yoqish
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "4px",
              flexShrink: 0,
            }}
            title="Yopish"
          >
            <IoClose size={18} />
          </button>
        </div>
      )}

      {/* 2. Bildirishnoma brauzerda bloklangan bo'lsa yo'riqnoma modali */}
      {showDeniedModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            background: "rgba(2, 6, 23, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            padding: "16px",
          }}
          onClick={() => setShowDeniedModal(false)}
        >
          <div
            style={{
              background: "rgba(15, 23, 42, 0.98)",
              border: "1px solid rgba(249, 115, 22, 0.4)",
              borderRadius: "20px",
              padding: "24px 22px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
              color: "#f8fafc",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fb923c", marginBottom: "12px" }}>
              <IoInformationCircle size={26} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Bildirishnomalar bloklangan</h3>
            </div>
            <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 14px" }}>
              Brauzeringizda ushbu sayt uchun bildirishnomalar o'chirilgan (taqiqlangan). Ularni yoqish uchun:
            </p>
            <ol style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, margin: "0 0 18px", paddingLeft: "20px" }}>
              <li>Brauzerning yuqori qismidagi manzil qatorida joylashgan <strong> (qulf)</strong> belgisini bosing.</li>
              <li><strong>"Bildirishnomalar" (Notifications)</strong> bo'limidan <strong>"Ruxsat berish" (Allow)</strong> sozlamasini tanlang.</li>
              <li>Sahifani qayta yangilang.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowDeniedModal(false)}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                border: "none",
                color: "#fff",
                padding: "10px",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "13.5px",
                cursor: "pointer",
              }}
            >
              Tushundim
            </button>
          </div>
        </div>
      )}

      {/* 3. Yangi xabar kelganda barcha sahifalarda chiquvchi Jonli Toast Banner */}
      {toastNews && (
        <aside
          aria-live="polite"
          aria-label="Yangi xabar bildirishnomasi"
          style={{
            position: "fixed",
            top: "20px",
            right: "50%",
            transform: "translateX(50%)",
            zIndex: 10000,
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(28, 25, 23, 0.98))",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(249, 115, 22, 0.5)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(249, 115, 22, 0.25)",
            borderRadius: "20px",
            padding: "16px 20px",
            width: "min(420px, calc(100vw - 28px))",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "700",
                color: "#fb923c",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <IoNotifications size={16} /> Yangi Maktab Xabari
            </span>
            <button
              type="button"
              onClick={() => setToastNews(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              <IoClose size={20} />
            </button>
          </div>

          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#f8fafc" }}>
              {toastNews.title || toastNews.sarlavha || "Yangi yangilik"}
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#cbd5e1",
                lineHeight: "1.4",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {toastNews.description || toastNews.tavsif || toastNews.content || ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setToastNews(null);
              navigate("/news");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #ea580c, #f97316)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "4px",
              boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
            }}
          >
            Yangilikni o'qish <IoChevronForward size={15} />
          </button>
        </aside>
      )}
    </>
  );
}
