import React, { useEffect, useState } from "react";
import { RiWifiOffLine, RiWifiLine, RiSpeedUpLine } from "react-icons/ri";
import { IoClose } from "react-icons/io5";

export default function NetworkStatusNotifier() {
  const [status, setStatus] = useState(() => {
    if (typeof window !== "undefined" && "navigator" in window) {
      return navigator.onLine ? "online" : "offline";
    }
    return "online";
  });
  const [isSlow, setIsSlow] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [dismissedSlow, setDismissedSlow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      setStatus("offline");
      setShowRestored(false);
    };

    const handleOnline = () => {
      setStatus("online");
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 4500);
      return () => clearTimeout(timer);
    };

    // Internet tezligini kuzatish (Network Information API)
    const checkSpeed = () => {
      const conn =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;

      if (conn) {
        const isSlowConn =
          conn.effectiveType === "slow-2g" ||
          conn.effectiveType === "2g" ||
          (conn.rtt && conn.rtt > 1800) ||
          (conn.downlink && conn.downlink < 0.5);

        setIsSlow(Boolean(isSlowConn));
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (conn) {
      checkSpeed();
      conn.addEventListener("change", checkSpeed);
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (conn) {
        conn.removeEventListener("change", checkSpeed);
      }
    };
  }, []);

  return (
    <>
      {/* 1. Offline Banner (Internet uzilganda doimiy ko'rinadi) */}
      {status === "offline" && (
        <div
          role="alert"
          style={{
            position: "fixed",
            top: "55px",
            left: "48%",
            transform: "translateX(-50%)",
            zIndex: 10002,
            background: "linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(153, 27, 27, 0.95))",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(248, 113, 113, 0.4)",
            boxShadow: "0 14px 40px rgba(0,0,0,0.7), 0 0 25px rgba(239, 68, 68, 0.3)",
            borderRadius: "18px",
            padding: "12px 20px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "min(460px, calc(100vw - 32px))",
            animation: "offlineSlideDown 0.4s ease-out",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: "9px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            <RiWifiOffLine />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>
              Internet aloqasi uzildi
            </h4>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#fca5a5", lineHeight: 1.35 }}>
              Saytda ba'zi medialar va yangiliklari yuklanmasligi mumkin. Tarmog'ingizni tekshiring.
            </p>
          </div>
        </div>
      )}

      {/* 2. Online Restored Notification (Internet tiklanganda 4 soniya ko'rinadi) */}
      {status === "online" && showRestored && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: "18px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10002,
            background: "linear-gradient(135deg, rgba(22, 101, 52, 0.95), rgba(21, 128, 61, 0.95))",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(74, 222, 128, 0.4)",
            boxShadow: "0 14px 40px rgba(0,0,0,0.7), 0 0 25px rgba(34, 197, 94, 0.3)",
            borderRadius: "18px",
            padding: "12px 20px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "min(440px, calc(100vw - 32px))",
            animation: "offlineSlideDown 0.4s ease-out",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.18)",
              padding: "9px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            <RiWifiLine />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>
              Internet aloqasi tiklandi!
            </h4>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#86efac" }}>
              Sayt yana to'liq va uzluksiz rejimda ishlamoqda.
            </p>
          </div>
        </div>
      )}

      {/* 3. Slow Internet Detector (Sekin tezlik sezilganda) */}
      {status === "online" && !showRestored && isSlow && !dismissedSlow && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            left: "20px",
            zIndex: 9998,
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(245, 158, 11, 0.45)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            borderRadius: "16px",
            padding: "10px 14px",
            color: "#f8fafc",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "min(340px, calc(100vw - 40px))",
          }}
        >
          <div
            style={{
              background: "rgba(245, 158, 11, 0.2)",
              color: "#fbbf24",
              padding: "7px",
              borderRadius: "10px",
              display: "flex",
            }}
          >
            <RiSpeedUpLine size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "12.5px", fontWeight: "600", color: "#fef3c7" }}>
              Internet tezligi sekinlashdi
            </p>
            <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#94a3b8" }}>
              Rasmlar yuklanishi biroz vaqt olishi mumkin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissedSlow(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "2px",
            }}
            title="Yopish"
          >
            <IoClose size={16} />
          </button>
        </div>
      )}
    </>
  );
}
