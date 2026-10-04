import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { HashLoader } from "react-spinners";
import { FiLock, FiMail, FiAlertCircle } from "react-icons/fi";
import { RiAdminLine } from "react-icons/ri";

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Iltimos, email va parolni kiriting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error("Login xatolik:", err);
      let message = "Tizimga kirishda xatolik yuz berdi.";
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        message = "Email yoki parol noto'g'ri kiritildi.";
      } else if (err.code === "auth/invalid-email") {
        message = "Email formati noto'g'ri.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Urinishlar soni ko'payib ketdi. Birozdan so'ng qayta urinib ko'ring.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Internet tarmog'i bilan aloqa yo'q.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(249, 115, 22, 0.3)",
          borderRadius: "24px",
          padding: "36px 28px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(249, 115, 22, 0.1)",
          color: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.3))",
              border: "1px solid rgba(249, 115, 22, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fb923c",
              fontSize: "28px",
              marginBottom: "14px",
            }}
          >
            <RiAdminLine />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px" }}>
            Admin Panel
          </h2>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
            8-Maktab boshqaruv paneliga kirish
          </p>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              padding: "12px 14px",
              borderRadius: "12px",
              fontSize: "13.5px",
              marginBottom: "20px",
            }}
          >
            <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#cbd5e1",
                marginBottom: "6px",
              }}
            >
              Email manzil
            </label>
            <div style={{ position: "relative" }}>
              <FiMail
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@maktab.uz"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px 12px 42px",
                  background: "rgba(30, 41, 59, 0.8)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "12px",
                  color: "#f8fafc",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#cbd5e1",
                marginBottom: "6px",
              }}
            >
              Parol
            </label>
            <div style={{ position: "relative" }}>
              <FiLock
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px 12px 42px",
                  background: "rgba(30, 41, 59, 0.8)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "12px",
                  color: "#f8fafc",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              width: "100%",
              padding: "13px",
              background: "linear-gradient(135deg, #ea580c, #f97316)",
              border: "none",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(249, 115, 22, 0.35)",
              transition: "transform 0.15s, opacity 0.15s",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? <HashLoader color="#ffffff" size={20} /> : "Tizimga kirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
