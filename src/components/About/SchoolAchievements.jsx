import React from "react";
import { FaTrophy, FaMedal, FaCertificate, FaStar } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import "./SchoolAchievements.css";

const ACHIEVEMENTS = [
  {
    id: 1,
    icon: <FaTrophy />,
    badge: "Olimpiada natijalari",
    title: "Respublika & Viloyat Olimpiadalari",
    desc: "O'quvchilarimiz aniq va tabiiy fanlar olimpiadalarining tuman va viloyat bosqichlarida muntazam 1-o'rinlarni egallab kelmoqda.",
    metric: "35+",
    metricLabel: "Sovrinli o'rinlar",
    theme: "amber",
  },
  {
    id: 2,
    icon: <FaCertificate />,
    badge: "Ta'lim sifati",
    title: "Namunali Ta'lim Maskani",
    desc: "Innovatsion pedagogik texnologiyalarni tatbiq etgani va yuqori bitirish ko'rsatkichlari uchun faxriy diplom bilan taqdirlangan.",
    metric: "100%",
    metricLabel: "Davlat attestatsiyasi",
    theme: "emerald",
  },
  {
    id: 3,
    icon: <FaMedal />,
    badge: "Sport & San'at",
    title: "Sport va San'at Zafarlari",
    desc: "Maktabimiz jamoalari shaxmat, voleybol va mini-futbol bo'yicha tuman birinchiliklarida oltin va kumush kuboklarni qo'lga kiritgan.",
    metric: "20+",
    metricLabel: "Kubok va medallar",
    theme: "cyan",
  },
  {
    id: 4,
    icon: <FaStar />,
    badge: "Pedagogik jamoa",
    title: "Ustozlar Mahorati E'tirofi",
    desc: "O'qituvchilarimiz respublika miqyosidagi 'Yilning eng yaxshi fan o'qituvchisi' tanlovlarida doimiy g'oliblikni saqlab kelmoqda.",
    metric: "15+",
    metricLabel: "Mukofotlangan ustozlar",
    theme: "purple",
  },
];

export default function SchoolAchievements() {
  return (
    <section className="school-achievements-section">
      <div className="school-achievements-container">
        {/* Header */}
        <div className="achievements-header">
          <div className="achievements-kicker">
            <HiSparkles className="achievements-sparkle" />
            <span>Faxrimiz va muvaffaqiyatlar</span>
          </div>
          <h2 className="achievements-title">
            Maktabimiz <span className="achievements-gradient-text">Yutuqlari & Faxrlari</span>
          </h2>
          <p className="achievements-subtitle">
            Har bir qo'lga kiritilgan g'alaba — bu o'quvchilarimizning tinimsiz izlanishi
            va mehribon ustozlarimizning zahmatli mehnati mevasidir.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="achievements-grid">
          {ACHIEVEMENTS.map((item) => (
            <div key={item.id} className={`achieve-card achieve-theme-${item.theme}`}>
              <div className="achieve-glow" />
              <div className="achieve-card-header">
                <div className="achieve-icon-wrapper">{item.icon}</div>
                <div className="achieve-metric-box">
                  <span className="achieve-metric-num">{item.metric}</span>
                  <span className="achieve-metric-text">{item.metricLabel}</span>
                </div>
              </div>

              <span className="achieve-badge">{item.badge}</span>
              <h3 className="achieve-card-title">{item.title}</h3>
              <p className="achieve-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
