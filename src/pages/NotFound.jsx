import React from "react";
import { BiLeftArrow } from "react-icons/bi";
import { FaTimes } from "react-icons/fa";
import { FaChevronLeft } from "react-icons/fa6";
import { IoHomeSharp } from "react-icons/io5";
import { SiGhostty } from "react-icons/si";
import { useNavigate } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <section className="notFoundSection display">
      <div className="nAcBtn">
        <button onClick={() => window.history.back()} className="backToOnePage">
          <FaChevronLeft /> orqaga
        </button>
        <button onClick={() => navigate("/")} className="nMainBtn">
          <IoHomeSharp /> Asosiy Sahifa
        </button>
      </div>
      <div className="notFoundIcons">
        <SiGhostty className="ghostIcon" />
        <FaTimes className="notIcon" />
      </div>
      <h1 className="notFoundTitle">sahifa mavjud emas</h1>
    </section>
  );
}
