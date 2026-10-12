import React from "react";
import { FaLandmark, FaSeedling, FaLaptopCode, FaTrophy, FaRocket } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import "./SchoolHistory.css";

const TIMELINE_EVENTS = [
  {
    year: "1985-yil",
    title: "Maktab Asos Solinishi",
    desc: "8-sonli umumta'lim maktabi o'z eshiklarini ilk bor ochdi. Fidoyi ustozlar jamoasi birinchi o'quvchilarga ta'lim bera boshladi.",
    icon: <FaSeedling />,
    tag: "Tarixiy poydevor",
    color: "#38bdf8",
  },
  {
    year: "2004-yil",
    title: "Keng Ko'lamli Rekonstruksiya",
    desc: "Maktab hududi kengaytirilib, zamonaviy sport majmuasi, faollar zali va yangi axborot-kutubxona markazi foydalanishga topshirildi.",
    icon: <FaLandmark />,
    tag: "Infratuzilma",
    color: "#10b981",
  },
  {
    year: "2016-yil",
    title: "Multimedia va Fan Xonalari",
    desc: "Sinfxonalarga proyektorlar, zamonaviy elektron doskalar va kimyo-biologiya laboratoriya uskunalari to'liq o'rnatildi.",
    icon: <FaLaptopCode />,
    tag: "Modernizatsiya",
    color: "#f59e0b",
  },
  {
    year: "2021-yil",
    title: "Respublika va Fan Olimpiadalari",
    desc: "O'quvchilarimiz respublika va xalqaro tanlovlarda sovrinli o'rinlarni zabt etib, maktabimiz nufuzini yuksaltirdi.",
    icon: <FaTrophy />,
    tag: "Katta zafarlar",
    color: "#c084fc",
  },
  {
    year: "Bugungi kun",
    title: "Zamonaviy Raqamli Ta'lim Maskani",
    desc: "1200 dan ortiq iqtidorli o'g'il-qizlar uchun chuqurlashtirilgan IT, aniq fanlar va xorijiy tillar muhiti yaratildi.",
    icon: <FaRocket />,
    tag: "Kelajak sari",
    color: "#f97316",
  },
];

export default function SchoolHistory() {
  return (
    <section className="school-history-section">
      <div className="school-history-container">
        {/* Yuqori Header */}
        <div className="history-header">
          <div className="history-kicker">
            <HiSparkles className="history-sparkle" />
            <span>Bosib o'tilgan sharafli yo'l</span>
          </div>
          <h2 className="history-title">
            Maktabimiz <span className="history-gradient-text">Tarixi & Rivojlanishi</span>
          </h2>
          <p className="history-subtitle">
            Har bir o'n yillik — yangi yutuqlar, fidoyi ustozlar mehnati va yuzlab
            muvaffaqiyatli bitiruvchilarning unutilmas hayot yo'lidir.
          </p>
        </div>

        {/* Interaktiv Timeline */}
        <div className="history-timeline">
          <div className="history-timeline-line" aria-hidden="true" />

          {TIMELINE_EVENTS.map((item, index) => {
            const isEven = index % 2 === 1;
            return (
              <div
                key={item.year}
                className={`history-card-wrap ${isEven ? "timeline-right" : "timeline-left"}`}
              >
                {/* O'rtadagi nuqta (node) */}
                <div
                  className="timeline-node"
                  style={{ borderColor: item.color, boxShadow: `0 0 16px ${item.color}55` }}
                >
                  <span className="timeline-node-icon" style={{ color: item.color }}>
                    {item.icon}
                  </span>
                </div>

                {/* Shisha karta */}
                <div className="history-card">
                  <div className="history-card-header">
                    <span
                      className="history-year-badge"
                      style={{
                        background: `${item.color}1f`,
                        color: item.color,
                        borderColor: `${item.color}44`,
                      }}
                    >
                      {item.year}
                    </span>
                    <span className="history-tag">{item.tag}</span>
                  </div>
                  <h3 className="history-card-title">{item.title}</h3>
                  <p className="history-card-desc">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
