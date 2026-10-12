import React from "react";
import { FaGraduationCap, FaHeart, FaLightbulb, FaHandsHoldingChild } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import "./MissionValues.css";

const VALUES_LIST = [
  {
    id: 1,
    icon: <FaGraduationCap />,
    title: "Chuqur va Sifatli Ilm",
    desc: "Davlat ta'lim standartlariga to'liq mos, chuqurlashtirilgan va amaliyotga yo'naltirilgan zamonaviy ta'lim tizimi.",
    highlight: "Akademik mukammallik",
    theme: "blue",
  },
  {
    id: 2,
    icon: <FaHeart />,
    title: "Yuksak Tarbiya & Odob",
    desc: "Ilm tarbiyasiz meva bermaydi. Maktabimizda milliy qadriyatlar, odob-axloq va insoniylik eng oliy mezondir.",
    highlight: "Ma'naviy barkamollik",
    theme: "rose",
  },
  {
    id: 3,
    icon: <FaLightbulb />,
    title: "Innovatsiya & Tanqidiy Fikrlash",
    desc: "O'quvchilarni shunchaki yodlashga emas, tahlil qilish, muammolarni mustaqil yechish va loyihalar yaratishga o'rgatamiz.",
    highlight: "Mustaqil dunyoqarash",
    theme: "amber",
  },
  {
    id: 4,
    icon: <FaHandsHoldingChild />,
    title: "Mehr-Oqibat & Do'stona Muhit",
    desc: "Har bir bola o'zini xavfsiz, qadrli va baxtli his qiladigan, bir-birini qo'llab-quvvatlovchi jamoaviy makon.",
    highlight: "Ishonchli maskan",
    theme: "emerald",
  },
];

export default function MissionValues() {
  return (
    <section className="mission-values-section">
      <div className="mission-values-container">
        {/* Header */}
        <div className="mission-header">
          <div className="mission-kicker">
            <HiSparkles className="mission-sparkle" />
            <span>Asosiy maqsad va yo'nalish</span>
          </div>
          <h2 className="mission-title">
            Bizning <span className="mission-highlight">Missiyamiz & Qadriyatlarimiz</span>
          </h2>
          <p className="mission-subtitle">
            8-Maktab — bu shunchaki bino emas, bu har bir o'quvchining orzulari
            qanot qoqadigan, kelajagi poydevor topadigan nufuzli ilm dargohidir.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="mission-grid">
          {VALUES_LIST.map((val) => (
            <div key={val.id} className={`mission-card mission-theme-${val.theme}`}>
              <div className="mission-card-glow" />
              <div className="mission-icon-box">
                <span className="mission-icon">{val.icon}</span>
              </div>
              <span className="mission-card-tag">{val.highlight}</span>
              <h3 className="mission-card-title">{val.title}</h3>
              <p className="mission-card-desc">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
