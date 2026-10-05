import React, { useState, useEffect } from "react";
import PrincipalSection from "../components/About/PrincipalSection";

// ─── ABOUT SAHIFASI ORQA FON RASMI ───────────────────────────────────────────
// Agar kelajakda orqa fon rasmini o'zgartirmoqchi bo'lsangiz, shu yerdagi importni
// bemalol almashtirishingiz mumkin.
import atlasVaGilam from "../assets/images/About/atlasVaGilam.png";

function About() {
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    // Rasmni xotiraga (cache) to'liq yuklab olgach, silliq (fade-in) ko'rsatish
    // Bu usul rasm tepadan pastga qarab chiziq bo'lib yuklanishining oldini oladi
    const img = new Image();
    img.src = atlasVaGilam;
    if (img.complete) {
      setBgLoaded(true);
    } else {
      img.onload = () => setBgLoaded(true);
    }
  }, []);

  return (
    <div
      className="about-page-wrapper"
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        marginBottom: "-80px",
      }}
    >
      {/* ─── ORQA FON QATLAMI ───
          1. position: fixed orqali sahifa skroll bo'lganda ham to'liq qoplab turadi.
          2. Rasm to'liq yuklanguncha opacity: 0 bo'lib turadi va tayyor bo'lgach silliq ochiladi.
      */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundColor: "#070b14",
          pointerEvents: "none",
        }}
      >
        <img
          src={atlasVaGilam}
          alt="About background"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            opacity: bgLoaded ? 1 : 0,
            transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* ─── SAHIFA KONTENTI (Orqa fondan tepada turishi uchun zIndex: 1) ─── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <PrincipalSection />
      </div>
    </div>
  );
}

export default About;