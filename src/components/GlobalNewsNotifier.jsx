import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoNotifications, IoClose, IoChevronForward, IoInformationCircle } from "react-icons/io5";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const NOTIFIED_IDS_KEY = "notified_news_ids_v2";

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
    // Autoplay cheklovi bo'lsa xatolik chiqarmaslik
  }
}

// Brauzer va Telefon uchun Push Notification yuborish (Desktop + Mobile Moslashuvchan)
async function sendSystemNotification(item, onOpenNews) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title = item.title || item.sarlavha || "8-Maktab: Yangi xabar!";
  const body = item.description || item.tavsif || item.content || "Maktabimizda yangi yangilik e'lon qilindi.";
  const icon = item.image || item.rasm || "/schoolLogo.png";

  const options = {
    body: body.length > 120 ? body.slice(0, 117) + "..." : body,
    icon: icon,
    badge: icon,
    tag: String(item.id || item._id || Date.now()),
    requireInteraction: false,
    data: { url: "/news" },
  };

  // 1. Mobil Android Chrome va ServiceWorker qo'llab-quvvatlaydigan muhitlar uchun
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    } catch {
      // Service worker bo'lmasa new Notification ga o'tiladi
    }
  }

  // 2. Desktop va standart Web Notification qo'llab-quvvatlovchi brauzerlar uchun
  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      if (onOpenNews) onOpenNews();
      try {
        notif.close();
      } catch {}
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

  // Toast avtomatik 10 soniyadan so'ng yopilishi uchun
  useEffect(() => {
    if (!toastNews) return;
    const timer = setTimeout(() => {
      setToastNews(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [toastNews]);

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
            sendSystemNotification(
              {
                title: "Bildirishnomalar yoqildi! 🔔",
                description: "Maktabimizning yangi xabarlaridan birinchilardan bo'lib boxabar bo'lasiz.",
              },
              () => navigate("/news")
            );
          } else if (res === "denied") {
            setShowDeniedModal(true);
          }
        }
      });

      if (requestRes && typeof requestRes.then === "function") {
        finalResult = await requestRes;
        setPermissionState(finalResult);
        if (finalResult === "granted") {
          sendSystemNotification(
            {
              title: "Bildirishnomalar yoqildi! 🔔",
              description: "Maktabimizning yangi xabarlaridan birinchilardan bo'lib boxabar bo'lasiz.",
            },
            () => navigate("/news")
          );
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

  // Real-time Firestore Listener (Hech qanday kesh yo'q, zudlik bilan ishlaydi)
  useEffect(() => {
    let isInitialLoad = true;

    // Oldin bildirilgan ID larni olish
    const getStoredIds = () => {
      try {
        const stored = localStorage.getItem(NOTIFIED_IDS_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    };

    // ID larni saqlash
    const saveStoredIds = (ids) => {
      try {
        const unique = Array.from(new Set(ids)).slice(-300);
        localStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(unique));
      } catch {}
    };

    let unsubscribe = () => {};

    try {
      const newsCollectionRef = collection(db, "news");

      unsubscribe = onSnapshot(
        newsCollectionRef,
        (snapshot) => {
          const storedIds = getStoredIds();
          const storedSet = new Set(storedIds.map(String));

          // 1. Birinchi yuklanish (Dastlabki mavjud xabarlar)
          if (isInitialLoad) {
            const allDocIds = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return String(docSnap.id || d.id || d.title || "");
            }).filter(Boolean);

            if (storedIds.length === 0) {
              // Yangi foydalanuvchi bo'lsa, mavjudlarni saqlab qo'yamiz (spam bo'lmasligi uchun)
              saveStoredIds(allDocIds);
            } else {
              // Mavjud ro'yxatni yangilab qo'yamiz
              saveStoredIds([...storedIds, ...allDocIds]);
            }

            isInitialLoad = false;
            return;
          }

          // 2. Haqiqiy vaqt rejimida (Real-time) yangi yangilik qo'shilishi
          const brandNewItems = [];
          const updatedIds = [...storedIds];

          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              const id = String(change.doc.id || data.id || data.title || "");

              if (id && !storedSet.has(id)) {
                brandNewItems.push({
                  id: change.doc.id,
                  ...data,
                });
                storedSet.add(id);
                updatedIds.push(id);
              }
            }
          });

          if (brandNewItems.length > 0) {
            // ID larni darhol saqlab qo'yamiz
            saveStoredIds(updatedIds);

            // Eng oxirgi qo'shilgan yangilik
            const latestNew = brandNewItems[brandNewItems.length - 1];

            // 1. Ovoz chiqarish
            playNotificationSound();

            // 2. Brauzer/Telefon Push Notification
            sendSystemNotification(latestNew, () => navigate("/news"));

            // 3. Sayt ichidagi Jonli Toast Popup banner
            setToastNews(latestNew);
          }
        },
        (err) => {
          console.warn("Firestore real-time listener xatosi:", err);
        }
      );
    } catch (err) {
      console.warn("Firestore collection listener ulanmadi:", err);
    }

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  // Agar ruxsat berilmagan bo'lsa va foydalanuvchi yopmagan bo'lsa banner ko'rinadi
  const isBannerVisible =
    typeof window !== "undefined" &&
    "Notification" in window &&
    permissionState !== "granted" &&
    !isDismissed;

  return (
    <>
      {/* 1. Bildirishnoma ruxsat berish taklifi banneri */}
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
              <li>Brauzerning yuqori qismidagi manzil qatorida joylashgan qulf yoki sozlama belgisini bosing.</li>
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
            animation: "fadeInDown 0.3s ease-out",
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

