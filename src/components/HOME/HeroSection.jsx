import { useState } from "react";
import LazyImage from "../LazyImage";
import schoolImage from "../../assets/images/Home/MySchoolImage.png";
import oneSectionBackground from "../../assets/images/Home/oneSectionBackground.png";
import "./HeroSection.css";

export default function HeroSection() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const rotateY = (x - 0.5) * 26;
    const rotateX = (0.5 - y) * 20;

    setTilt({ x: rotateY, y: rotateX });
  };

  const resetTilt = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section
      className="heroSectionCard"
      onMouseMove={handlePointerMove}
      onMouseLeave={resetTilt}
    >
      <img className="homeOneSectionBg" src={oneSectionBackground} alt="Background" />
      <div className="homeOneSection_Bg__InsetShadow"></div>
      <ul className="heroList display">
        <li>
          <LazyImage
            className="schoolImage"
            src={schoolImage}
            alt="School Image"
            style={{
              transform: `perspective(1200px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) rotateZ(${tilt.x * 0.2}deg)`,
            }}
          />
        </li>
        <li className="heroTextBlock">
          <p className="heroEyebrow">Ta'lim muassasi</p>
          <h1 className="heroTitle">8 - Maktab</h1>
          <h2 className="heroLocation">Uychi tumani -</h2>
          <h3 className="heroPrincipalName">
            Djamoldinova Mutabar Xoshimovna{" "}
          </h3>
          <div className="glowHero"></div>
        </li>
      </ul>
    </section>
  );
}
