import React, { useEffect, useState } from "react";
import { HashLoader } from "react-spinners";
import { VscChatSparkleError } from "react-icons/vsc";
import { IoNotificationsOutline, IoNotifications } from "react-icons/io5";
import { fetchWithJsonbinCache } from "../utils/jsonbinCache";
import LazyImage from "../components/LazyImage";

const BIN_ID = "6ab11f8effd5d160531f39ea";
const MASTER_KEY = "$2a$10$P2EP5iL5TTjPvxXdGmgRJeZ0SuAQRZpwWmOWJV5dLBWuS791xj2jm";
const CACHE_KEY = "news-section-cache";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 daqiqa kesh muddati (ortiqcha requestlarning oldini oladi)

// Yangi xabarlarga bildirishnoma yuborish funksiyasi
function sendWebNotification(item) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title = item.title || item.sarlavha || "Yangi maktab yangiligi!";
  const body = item.description || item.tavsif || item.content || "Maktabimizda yangi xabar e'lon qilindi.";
  const icon = item.image || item.rasm || "/schoolLogo.png";

  try {
    const notification = new Notification(title, {
      body: body.length > 130 ? body.slice(0, 127) + "..." : body,
      icon: icon,
      badge: icon,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.warn("Notification ko'rsatishda xatolik:", err);
  }
}

function News() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Sizning brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi.");
      return;
    }

    if (Notification.permission === "denied") {
      alert("Brauzeringizda bildirishnomalar bloklangan. Ularni yoqish uchun brauzerning yuqori qismidagi manzil qatorida joylashgan 🔒 (qulf) belgisini bosib, bildirishnomalarga ruxsat berishingiz va sahifani yangilashingiz kerak.");
      return;
    }

    try {
      let result = Notification.permission;
      const req = Notification.requestPermission((res) => {
        if (res) {
          setPermission(res);
          if (res === "granted") {
            try {
              new Notification("Bildirishnomalar yoqildi! 🔔", {
                body: "Yangi maktab yangiliklari shu yerda chiqib turadi.",
              });
            } catch (e) {}
          }
        }
      });

      if (req && typeof req.then === "function") {
        result = await req;
        setPermission(result);
        if (result === "granted") {
          try {
            new Notification("Bildirishnomalar yoqildi! 🔔", {
              body: "Yangi maktab yangiliklari shu yerda chiqib turadi.",
            });
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Ruxsat so'rash xatosi:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchNewsData = async () => {
      try {
        const result = await fetchWithJsonbinCache({
          binId: BIN_ID,
          masterKey: MASTER_KEY,
          cacheKey: CACHE_KEY,
          ttlMs: CACHE_TTL_MS,
        });

        const record = result?.data;
        let incomingItems = [];
        if (Array.isArray(record)) {
          incomingItems = record;
        } else if (Array.isArray(record?.news)) {
          incomingItems = record.news;
        } else if (Array.isArray(record?.yangiliklar)) {
          incomingItems = record.yangiliklar;
        } else if (record && typeof record === "object") {
          incomingItems = [record];
        }

        if (isMounted) {
          setNewsList(incomingItems);
          setLoading(false);
        }
      } catch (err) {
        console.error("Yangiliklarni olishda xatolik:", err);
        if (isMounted) {
          setError(err.message || "Ma'lumotlarni yuklab bo'lmadi");
          setLoading(false);
        }
      }
    };

    fetchNewsData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="news-wrapper display">
      {/* Sarlavha qismi */}
      <header className="news-header">
        <h1 className="news-main-title">
          Maktab Yangiliklari
        </h1>
        <p className="news-subtitle">
          Eng so'nggi xabarlar, tadbirlar va e'lonlar
        </p>

        {/* Bildirishnoma ruxsat holati */}
        {typeof window !== "undefined" && "Notification" in window && (
          <div className="news-notif-action">
            {permission === "granted" ? (
              <span className="news-permission-active">
                <IoNotifications size={16} /> Bildirishnomalar faol
              </span>
            ) : (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="news-permission-btn"
              >
                <IoNotificationsOutline size={17} /> Bildirishnomalarga ruxsat berish
              </button>
            )}
          </div>
        )}
      </header>

      {/* 1. Yuklanish holati */}
      {loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "260px",
            gap: "16px",
          }}
        >
          <HashLoader color="#f97316" size={50} />
          <p style={{ color: "#94a3b8", fontSize: "15px" }}>Yangiliklar yuklanmoqda...</p>
        </div>
      )}

      {/* 2. Xatolik holati */}
      {!loading && error && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "rgba(239, 68, 68, 0.08)",
            borderRadius: "20px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#ef4444",
          }}
        >
          <VscChatSparkleError size={44} style={{ marginBottom: "12px" }} />
          <h3 style={{ fontSize: "1.25rem", color: "#f87171", marginBottom: "8px" }}>
            Xatolik yuz berdi
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>{error}</p>
        </div>
      )}

      {/* 3. Bo'sh holat */}
      {!loading && !error && newsList.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "20px",
            border: "1px solid rgba(148, 163, 184, 0.15)",
            color: "#94a3b8",
          }}
        >
          <p>Hozircha hech qanday yangilik mavjud emas.</p>
        </div>
      )}

      {/* 4. Ustunma-ustun (Responsive Feed) Yangiliklar ro'yxati */}
      {!loading && !error && newsList.length > 0 && (
        <div className="news-list">
          {newsList.map((item, index) => {
            const title = item.title || item.sarlavha || item.name || `Yangilik #${index + 1}`;
            const description = item.description || item.tavsif || item.content || item.matn || "";
            const date = item.date || item.sana || item.created_at || "";
            const image = item.image || item.rasm || item.img || null;
            const author = item.author || item.muallif || null;

            return (
              <article
                key={item.id ?? index}
                className="news-card"
              >
                {/* Rasm mavjud bo'lsa */}
                {image && (
                  <div className="news-image-wrapper">
                    <LazyImage
                      src={image}
                      alt={title}
                      className="news-image"
                    />
                  </div>
                )}

                {/* Kontent qismi */}
                <div className="news-content">
                  <div className="news-meta-row">
                    {date && (
                      <span className="news-date-badge">
                        {date}
                      </span>
                    )}

                    {author && (
                      <span className="news-author">
                        ✍️ {author}
                      </span>
                    )}
                  </div>

                  <h2 className="news-title">
                    {title}
                  </h2>

                  {description && (
                    <p className="news-description">
                      {description}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default News;