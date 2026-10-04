import React, { useEffect, useState } from "react";
import SchoolTitleFor from "/SchoolTitleFor.png";
import { HashLoader } from "react-spinners";
import { VscChatSparkleError } from "react-icons/vsc";
import { IoNotificationsOutline, IoNotifications } from "react-icons/io5";
// JSONBin o'chirilmagan, faqat ishlatilmaydigan holatga keltirilgan:
// import { fetchWithJsonbinCache } from "../utils/jsonbinCache";
// const BIN_ID = "6ab11f8effd5d160531f39ea";
// const MASTER_KEY = "$2a$10$P2EP5iL5TTjPvxXdGmgRJeZ0SuAQRZpwWmOWJV5dLBWuS791xj2jm";
// const CACHE_KEY = "news-section-cache";
// const CACHE_TTL_MS = 15 * 60 * 1000;

import { fetchNewsFromFirestore } from "../utils/firestoreService";
import LazyImage from "../components/LazyImage";
import { FaExclamation } from "react-icons/fa";

const CACHE_TTL_MS = 8 * 60 * 1000; // 8 daqiqa kesh muddati

// Galereya alohida rasm katagi (har qanday ekranda to'g'ri sig'ishi va bosilganda ochilishi uchun)
function GalleryItem({ src, alt, onImageClick }) {
  return (
    <div
      onClick={() => onImageClick && onImageClick(src)}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <LazyImage
        src={src}
        alt={alt || "Yangilik rasmi"}
        className="news-image"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 0.3s ease",
        }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = SchoolTitleFor;
        }}
      />
    </div>
  );
}

// 1 tadan 5 tagacha rasmlarni barcha ekranlarga (Desktop / Mobile) moslab ko'rsatuvchi galereya
function NewsGallery({ images, title, onImageClick }) {
  if (!images || images.length === 0) {
    return (
      <div className="news-image-wrapper" style={{ height: "clamp(240px, 45vw, 380px)", position: "relative" }}>
        <GalleryItem src={SchoolTitleFor} alt={title} onImageClick={onImageClick} />
      </div>
    );
  }

  // 1 ta rasm
  if (images.length === 1) {
    return (
      <div className="news-image-wrapper" style={{ height: "clamp(240px, 45vw, 380px)", position: "relative" }}>
        <GalleryItem src={images[0]} alt={title} onImageClick={onImageClick} />
      </div>
    );
  }

  // 2 ta rasm: 2 ustunli yonma-yon
  if (images.length === 2) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          width: "100%",
          height: "clamp(220px, 35vw, 340px)",
          background: "#0b1120",
          overflow: "hidden",
        }}
      >
        <GalleryItem
          src={images[0]}
          alt={`${title} - 1`}
          onImageClick={onImageClick}
        />
        <GalleryItem
          src={images[1]}
          alt={`${title} - 2`}
          onImageClick={onImageClick}
        />
      </div>
    );
  }

  // 3 ta rasm: Chapda 1 ta katta, o'ngda 2 ta ustma-ust
  if (images.length === 3) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "4px",
          width: "100%",
          height: "clamp(240px, 40vw, 360px)",
          background: "#0b1120",
          overflow: "hidden",
        }}
      >
        <GalleryItem src={images[0]} alt={`${title} - 1`} onImageClick={onImageClick} />
        <div
          style={{
            display: "grid",
            gridTemplateRows: "1fr 1fr",
            gap: "4px",
            height: "100%",
            minHeight: 0,
          }}
        >
          <GalleryItem src={images[1]} alt={`${title} - 2`} onImageClick={onImageClick} />
          <GalleryItem src={images[2]} alt={`${title} - 3`} onImageClick={onImageClick} />
        </div>
      </div>
    );
  }

  // 4 ta rasm: 2x2 to'r (grid)
  if (images.length === 4) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "4px",
          width: "100%",
          height: "clamp(240px, 42vw, 380px)",
          background: "#0b1120",
          overflow: "hidden",
        }}
      >
        {images.slice(0, 4).map((src, idx) => (
          <GalleryItem key={idx} src={src} alt={`${title} - ${idx + 1}`} onImageClick={onImageClick} />
        ))}
      </div>
    );
  }

  // 5 ta rasm: Yuqorida 2 ta, pastda 3 ta
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "1.1fr 0.9fr",
        gap: "4px",
        width: "100%",
        height: "clamp(260px, 45vw, 400px)",
        background: "#0b1120",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", height: "100%", minHeight: 0 }}>
        <GalleryItem src={images[0]} alt={`${title} - 1`} onImageClick={onImageClick} />
        <GalleryItem src={images[1]} alt={`${title} - 2`} onImageClick={onImageClick} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", height: "100%", minHeight: 0 }}>
        <GalleryItem src={images[2]} alt={`${title} - 3`} onImageClick={onImageClick} />
        <GalleryItem src={images[3]} alt={`${title} - 4`} onImageClick={onImageClick} />
        <GalleryItem src={images[4]} alt={`${title} - 5`} onImageClick={onImageClick} />
      </div>
    </div>
  );
}
function sendWebNotification(item) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title = item.title || item.sarlavha || "Yangi maktab yangiligi!";
  const body =
    item.description ||
    item.tavsif ||
    item.content ||
    "Maktabimizda yangi xabar e'lon qilindi.";
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
  const [activeModalImage, setActiveModalImage] = useState(null);
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
  );

  // ESC tugmasi orqali rasm modalini yopish va fonni qulflash
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveModalImage(null);
      }
    };
    if (activeModalImage) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [activeModalImage]);

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Sizning brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi.");
      return;
    }

    if (Notification.permission === "denied") {
      alert(
        "Brauzeringizda bildirishnomalar bloklangan. Ularni yoqish uchun brauzerning yuqori qismidagi manzil qatorida joylashgan 🔒 (qulf) belgisini bosib, bildirishnomalarga ruxsat berishingiz va sahifani yangilashingiz kerak.",
      );
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
        const result = await fetchNewsFromFirestore({
          ttlMs: CACHE_TTL_MS,
        });

        // Firestore dan kelgan ma'lumot to'g'ridan-to'g'ri massiv
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
        <h1 className="news-main-title">Maktab Yangiliklari</h1>
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
                <IoNotificationsOutline size={17} /> Bildirishnomalarga ruxsat
                berish
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
          <p style={{ color: "#94a3b8", fontSize: "15px" }}>
            Yangiliklar yuklanmoqda...
          </p>
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
          <h3
            style={{
              fontSize: "1.25rem",
              color: "#f87171",
              marginBottom: "8px",
            }}
          >
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
            const title =
              item.title || item.sarlavha || item.name || `Yangilik / Xabar`;
            const description =
              item.description ||
              item.tavsif ||
              item.content ||
              item.matn ||
              "";
            const date = item.date || item.sana || item.created_at || "";
            const rawImages = Array.isArray(item.images) && item.images.length > 0
              ? item.images
              : (item.image || item.rasm || item.img ? [item.image || item.rasm || item.img] : []);
            const author = item.author || item.muallif || null;
            const demand = item.demand || item.talab || null;

            return (
              <article key={item.id ?? index} className="news-card">
                {/* Moslashuvchan Rasmlar galereyasi (1 tadan 5 tagacha) */}
                <NewsGallery
                  images={rawImages}
                  title={title}
                  onImageClick={(src) => setActiveModalImage(src)}
                />
                {/* Kontent qismi */}
                <div className="news-content">
                  <div className="news-meta-row">
                    {date && <span className="news-date-badge">{date}</span>}

                    {author && <span className="news-author">{author}</span>}
                  </div>

                  <h2 className="news-title">{title}</h2>

                  {description && (
                    <p className="news-description">{description}</p>
                  )}
                  {demand && (
                    <div className="news-demand">
                      <div className="news-demand-header">
                        <FaExclamation className="news-demand-icon" />
                        <strong className="news-demand-title">
                          Majburiy Talab / Ogohlantirish:
                        </strong>
                      </div>
                      <p className="news-demand-text">{demand}</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 5. Rasm ustiga bosilganda ochiladigan to'liq o'lchamli ko'rish oynasi (Lightbox Modal) */}
      {activeModalImage && (
        <div
          onClick={() => setActiveModalImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(3, 7, 18, 0.88)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "zoom-out",
          }}
        >
          {/* Yopish tugmasi */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveModalImage(null);
            }}
            title="Yopish (ESC)"
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#ffffff",
              fontSize: "20px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100000,
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
              transition: "transform 0.2s, background 0.2s",
            }}
          >
            ✕
          </button>

          {/* O'rtadagi to'liq ko'rinuvchi rasm */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "88vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              cursor: "default",
            }}
          >
            <img
              src={activeModalImage}
              alt="rasm ayrim sabablarga ko'ra mavjud emas."
              style={{padding: "4px 10px",
                maxWidth: "100%",
                maxHeight: "88vh",
                objectFit: "contain",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(249, 115, 22, 0.2)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default News;
