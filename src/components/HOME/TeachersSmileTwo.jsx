import React, { useState } from "react";
import LazyImage from "../LazyImage";
import TeachersSmileTwoImage from "../../assets/images/Home/TeachersSmileTwo.png";
import TeachersSmileThree from "../../assets/images/Home/TeachersSmileThree.png";
import TeachersSmileFour from "../../assets/images/Home/TeachersSmileFour.png";
import TeachersSmileFive from "../../assets/images/Home/TeachersSmileFIve.png";
import TeachersSmileSix from "../../assets/images/Home/TeachersSmileSix.png";
import { FaExpand, FaTimes } from "react-icons/fa";
import "./TeachersSmileTwo.css";

const PHOTOS = [
  {
    id: 1,
    src: TeachersSmileTwoImage,
    label: "Maktabimizning tajribali ayol ustozlari",
    tag: "Faxriy pedagoglar",
  },
  {
    id: 2,
    src: TeachersSmileThree,
    label: "8-Maktab pedagogik jamoasi",
    tag: "Pedagogik jamoa",
  },
  {
    id: 3,
    src: TeachersSmileFour,
    label: "Ustozlarimiz pedagogik kengashda",
    tag: "Ilmiy jamoa",
  },
  {
    id: 4,
    src: TeachersSmileFive,
    label: "Ilm-ma'rifat fidoyilari",
    tag: "Ustozlar",
  },
  {
    id: 5,
    src: TeachersSmileSix,
    label: "Jonkuyar va mehribon ustozlarimiz",
    tag: "Pedagoglar",
  },
];

export default function TeachersSmileTwo() {
  const [lightbox, setLightbox] = useState(null);

  const openLightbox = (photo) => {
    setLightbox(photo);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightbox(null);
    document.body.style.overflow = "";
  };

  return (
    <section className="teachersSmileSection display">
      {/* ─── SARLAVHA ─── */}
      <div className="teachersSmileTitleWrap">
        <span className="teachersSmileBadge">Fotogalereya</span>
        <h2 className="teachersSmileTitle">Bizning faxrimiz bo'lgan ustozlar</h2>
        <p className="teachersSmileSubtitle">
          Maktabimizning har bir muvaffaqiyati ortida turgan fidoyi, mehribon va
          yuksak malakali pedagoglarimiz
        </p>
      </div>

      {/* ─── BIR TEKIS GRID (3 USTUNLI TEP, 2 USTUNLI PAST) ─── */}
      <div className="teachersSmileGrid">
        {PHOTOS.map((photo) => (
          <div
            key={photo.id}
            className="teachersSmileCard"
            onClick={() => openLightbox(photo)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openLightbox(photo);
            }}
            aria-label={photo.label}
          >
            {/* Rasm */}
            <LazyImage
              src={photo.src}
              alt={photo.label}
              className="teachersSmileCardImg"
            />

            {/* Hover overlay (kompyuterda hover, telefonlarda doimiy pastki band) */}
            <div className="teachersSmileCardOverlay" aria-hidden="true">
              <span className="teachersSmileCardTag">{photo.tag}</span>
              <p className="teachersSmileCardLabel">{photo.label}</p>
              <span className="teachersSmileCardBtn">
                <FaExpand aria-hidden="true" /> To'liq ko'rish
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── TO'LIQ EKRAN MODAL / LIGHTBOX ─── */}
      {lightbox && (
        <div
          className="teachersLightboxOverlay"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.label}
        >
          <div
            className="teachersLightboxContent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="teachersLightboxClose"
              onClick={closeLightbox}
              aria-label="Yopish"
            >
              <FaTimes />
            </button>

            <img
              src={lightbox.src}
              alt={lightbox.label}
              className="teachersLightboxImg"
            />

            <div className="teachersLightboxCaption">
              <span className="teachersLightboxTag">{lightbox.tag}</span>
              <h3>{lightbox.label}</h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
