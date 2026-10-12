import React from "react";
import { FaChalkboardUser, FaBookOpen, FaFlask, FaDumbbell } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import LazyImage from "../LazyImage";
import schoolYard from "../../assets/images/Home/SchoolImageFour.png";
import schoolHall from "../../assets/images/Home/SchoolImageFive.png";
import schoolEntrance from "../../assets/images/Home/SchoolImageTwo.png";
import schoolMain from "../../assets/images/Home/SchoolImageSix.png";
import "./CampusFacilities.css";

const FACILITIES = [
  {
    id: 1,
    title: "Smart Multimedia Sinfxonalar",
    desc: "Sensorli interaktiv doskalar, qulay ergonomik partalar va darslarni qiziqarli o'tish uchun multimedia vositalari bilan ta'minlangan.",
    icon: <FaChalkboardUser />,
    img: schoolMain,
    stat: "40+ Zamonaviy xona",
    theme: "cyan",
  },
  {
    id: 2,
    title: "Axborot-Resurs Kutubxonasi",
    desc: "15,000 dan ortiq boy kitoblar fondi, tinch mutolaa zali hamda planshet va kompyuterlar orqali raqamli e-kutubxona tizimi.",
    icon: <FaBookOpen />,
    img: schoolHall,
    stat: "15 000+ Kitob fondi",
    theme: "amber",
  },
  {
    id: 3,
    title: "Ilmiy Tajriba Laboratoriyalari",
    desc: "Fizika, kimyo va biologiya fanlari bo'yicha xavfsiz reagentlar, mikroskoplar va o'quv tajriba jihozlari to'liq jamlangan.",
    icon: <FaFlask />,
    img: schoolEntrance,
    stat: "Zamonaviy jihozlar",
    theme: "emerald",
  },
  {
    id: 4,
    title: "Katta Sport Majmuasi",
    desc: "Yopiq sport zali, ochiq futbol stadioni, voleybol va basketbol maydonchalari o'quvchilar salomatligi xizmatida.",
    icon: <FaDumbbell />,
    img: schoolYard,
    stat: "Yopiq va ochiq maydon",
    theme: "purple",
  },
];

export default function CampusFacilities() {
  return (
    <section className="campus-facilities-section">
      <div className="campus-facilities-container">
        {/* Header */}
        <div className="campus-header">
          <div className="campus-kicker">
            <HiSparkles className="campus-sparkle" />
            <span>Qulay va xavfsiz muhit</span>
          </div>
          <h2 className="campus-title">
            Zamonaviy <span className="campus-gradient-text">Shart-sharoitlar & Bino</span>
          </h2>
          <p className="campus-subtitle">
            O'quvchilarning har tomonlama kamol topishi uchun eng ilg'or
            texnologiyalar va barcha xavfsizlik talablariga javob beradigan infratuzilma.
          </p>
        </div>

        {/* 4 Cards Grid with Photo and Content */}
        <div className="campus-grid">
          {FACILITIES.map((item) => (
            <div key={item.id} className={`campus-card campus-theme-${item.theme}`}>
              <div className="campus-image-box">
                <LazyImage
                  src={item.img}
                  alt={item.title}
                  className="campus-img"
                />
                <span className="campus-stat-badge">{item.stat}</span>
              </div>
              <div className="campus-content">
                <div className="campus-title-row">
                  <div className="campus-icon-box">{item.icon}</div>
                  <h3 className="campus-card-title">{item.title}</h3>
                </div>
                <p className="campus-card-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
