import React from "react";
import PrincipalSection from "../components/About/PrincipalSection";

import atlasVaGilam from "../assets/images/About/atlasVaGilam.png";

function About() {
  return (
    <div
      className="about-page-wrapper"
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `url(${atlasVaGilam})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        marginBottom: "-80px",
      }}
    >
      <PrincipalSection />
    </div>
  );
}

export default About;