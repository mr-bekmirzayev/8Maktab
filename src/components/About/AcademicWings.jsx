import React from "react";
import {
  FaSquareRootVariable,
  FaBookOpen,
  FaLanguage,
  FaFlaskVial,
  FaLandmark,
  FaVolleyball,
  FaPalette,
  FaSeedling,
} from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import "./AcademicWings.css";

const DEPARTMENTS = [
  {
    id: "math",
    icon: <FaSquareRootVariable />,
    title: "Matematika To'garagi",
    subtitle: "Zukko hisobchi & Mantiq",
    desc: "Mantiqiy misol-masalalar, formulalar sirlari va tuman fan olimpiadasiga puxta tayyorgarlik.",
    badge: "Aniq fanlar",
    color: "#38bdf8",
  },
  {
    id: "native-lang",
    icon: <FaBookOpen />,
    title: "Ona Tili va Adabiyot",
    subtitle: "Yosh qalamkashlar & Kitobxonlik",
    desc: "Badiiy kitoblar mutolaasi, erkin insho yozish, she'riyat kechalari va nutq madaniyatini oshirish.",
    badge: "Ijodiy to'garak",
    color: "#f59e0b",
  },
  {
    id: "english",
    icon: <FaLanguage />,
    title: "Ingliz Tili To'garagi",
    subtitle: "Ingliz tili saboqlari",
    desc: "O'quvchilar uchun sodda so'zlashuv, lug'at boyligini oshirish va asosiy grammatika darslari.",
    badge: "Til saboqlari",
    color: "#a855f7",
  },
  {
    id: "physics-chemistry",
    icon: <FaFlaskVial />,
    title: "Fizika va Kimyo",
    subtitle: "Yosh tabiatshunoslar laboratoriyasi",
    desc: "Qiziqarli amaliy tajribalar, tabiat hodisalari mohiyati va oddiy fizik-kimyoviy sinovlar.",
    badge: "Amaliy fanlar",
    color: "#10b981",
  },
  {
    id: "history",
    icon: <FaLandmark />,
    title: "Tarix To'garagi",
    subtitle: "Ajdodlarimiz merosi",
    desc: "O'zbekiston tarixi, buyuk ajdodlarimiz va allomalar merosi hamda tarixiy obidalar bilan tanishuv.",
    badge: "Ma'naviyat",
    color: "#ec4899",
  },
  {
    id: "biology-geography",
    icon: <FaSeedling />,
    title: "Biologiya va Geografiya",
    subtitle: "Olam mo'jizalari",
    desc: "O'simliklar va hayvonot dunyosi, mikroskop orqali o'rganish, globus va xaritalar bilan ishlash.",
    badge: "Tabiiy fanlar",
    color: "#06b6d4",
  },
  {
    id: "art-craft",
    icon: <FaPalette />,
    title: "Tasviriy San'at & Mehnat",
    subtitle: "Mohir qo'llar",
    desc: "Rasm chizish, qog'oz va loydan milliy buyumlar yasash, maktab ko'rgazmalariga tayyorgarlik.",
    badge: "Ijod & San'at",
    color: "#f97316",
  },
  {
    id: "sports",
    icon: <FaVolleyball />,
    title: "Jismoniy Tarbiya & Sport",
    subtitle: "Futbol, Voleybol, Shaxmat",
    desc: "Sog'lom turmush tarzi, maktablararo sport musobaqalari va aql charxi bo'lgan shaxmat to'garagi.",
    badge: "Sport & Salomatlik",
    color: "#84cc16",
  },
];

export default function AcademicWings() {
  return (
    <section className="academic-wings-section">
      <div className="academic-wings-container">
        {/* Header */}
        <div className="academic-header">
          <div className="academic-kicker">
            <HiSparkles className="academic-sparkle" />
            <span>Maktabimiz fan to'garaklari</span>
          </div>
          <h2 className="academic-title">
            Fan To'garaklari va <span className="academic-gradient-text">Mashg'ulotlar</span>
          </h2>
          <p className="academic-subtitle">
            Darsdan so'ng o'quvchilarning sevimli fanlarini chuqurroq o'zlashtirishi va
            qobiliyatlarini rivojlantirishi uchun tashkil etilgan amaliy mashg'ulotlar.
          </p>
        </div>

        {/* Grid Cards (Oddiy maktab fanlari) */}
        <div className="academic-grid">
          {DEPARTMENTS.map((dept) => (
            <div key={dept.id} className="academic-card">
              <div
                className="academic-card-glow"
                style={{ background: dept.color }}
              />
              <div className="academic-top-bar">
                <div
                  className="academic-icon-wrapper"
                  style={{
                    color: dept.color,
                    borderColor: `${dept.color}35`,
                    boxShadow: `0 0 16px ${dept.color}25`,
                  }}
                >
                  {dept.icon}
                </div>
                <span
                  className="academic-badge"
                  style={{
                    color: dept.color,
                    backgroundColor: `${dept.color}18`,
                    borderColor: `${dept.color}35`,
                  }}
                >
                  {dept.badge}
                </span>
              </div>

              <h3 className="academic-card-title">{dept.title}</h3>
              <p className="academic-card-sub">{dept.subtitle}</p>
              <p className="academic-card-desc">{dept.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
