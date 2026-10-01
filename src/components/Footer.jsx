import React from "react";
import { Link } from "react-router-dom";
import { GiBookCover } from "react-icons/gi";
import { GoHome } from "react-icons/go";
import { TbExclamationCircle } from "react-icons/tb";
import { FaRegNewspaper, FaInfoCircle, FaArrowUp } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { PiChalkboardTeacherFill } from "react-icons/pi";
import { BsTelephoneFill, BsTelegram } from "react-icons/bs";
import { MdOutlineEmail, MdMessage } from "react-icons/md";
import { GrContactInfo } from "react-icons/gr";
import "./Footer.css";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="footer" className="site-footer">
      <div className="footer-top-glow" aria-hidden="true" />

      <div className="footer-inner-container display">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col footer-brand-col">
            <Link to="/" className="footer-brand-link" title="8-Maktab Asosiy Sahifa">
              <div className="footer-brand-box">
                <span className="footer-school-num">8</span>
                <div className="footer-school-text-box">
                  <h3 className="footer-school-city">Namangan</h3>
                  <hr className="footer-school-divider" />
                  <h3 className="footer-school-region">Uychi</h3>
                  <h3 className="footer-school-type">maktab</h3>
                </div>
              </div>
            </Link>
            <p className="footer-brand-desc">
              Namangan viloyati Uychi tumanidagi 8-sonli umumiy o'rta ta'lim maktabining rasmiy veb-sayti. Zamonaviy bilim va mustahkam tarbiya maskani.
            </p>
            <div className="footer-location-badge">
              <FaLocationDot />
              <span>Namangan v., Uychi t.</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">
              <span className="footer-title-indicator" />
              Sahifalar
            </h4>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <Link to="/">
                  <GoHome className="footer-link-icon" />
                  <span>Asosiy sahifa</span>
                </Link>
              </li>
              <li className="footer-link-item">
                <Link to="/about">
                  <TbExclamationCircle className="footer-link-icon" />
                  <span>Biz haqimizda</span>
                </Link>
              </li>
              <li className="footer-link-item">
                <Link to="/news">
                  <FaRegNewspaper className="footer-link-icon" />
                  <span>Yangiliklar</span>
                </Link>
              </li>
              <li className="footer-link-item">
                <Link to="/teachers">
                  <PiChalkboardTeacherFill className="footer-link-icon" />
                  <span>Ustozlar</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* School Info Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">
              <span className="footer-title-indicator" />
              Maktab
            </h4>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <Link to="/about">
                  <FaInfoCircle className="footer-link-icon" />
                  <span>Maktab haqida</span>
                </Link>
              </li>
              <li className="footer-link-item">
                <Link to="/news">
                  <MdMessage className="footer-link-icon" />
                  <span>So'nggi yangiliklar</span>
                </Link>
              </li>
              <li className="footer-link-item">
                <Link to="/teachers">
                  <GrContactInfo className="footer-link-icon" />
                  <span>Fan o'qituvchilari</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">
              <span className="footer-title-indicator" />
              Bog'lanish
            </h4>
            <div className="footer-contact-list">
              <a href="tel:+998999770917" className="footer-contact-card" title="Telefon qilmoq">
                <div className="footer-contact-icon-box">
                  <BsTelephoneFill style={{ transform: "scaleX(-1)" }} />
                </div>
                <div className="footer-contact-info">
                  <span className="footer-contact-label">Telefon</span>
                  <span className="footer-contact-value">+998 99 977 09 17</span>
                </div>
              </a>

              <a
                href="https://t.me/Yoip556"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-card"
                title="Telegram orqali bog'lanish"
              >
                <div className="footer-contact-icon-box">
                  <BsTelegram />
                </div>
                <div className="footer-contact-info">
                  <span className="footer-contact-label">Telegram</span>
                  <span className="footer-contact-value">@Yoip556</span>
                </div>
              </a>

              <a
                href="mailto:sakkizinchimaktab888@gmail.com?subject=Savol%20va%20Takliflar"
                className="footer-contact-card"
                title="Email orqali yozish"
              >
                <div className="footer-contact-icon-box">
                  <MdOutlineEmail />
                </div>
                <div className="footer-contact-info">
                  <span className="footer-contact-label">Email</span>
                  <span className="footer-contact-value">sakkizinchimaktab888@gmail.com</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            © {new Date().getFullYear()} <strong>8-Sonli Maktab</strong>. Barcha huquqlar himoyalangan.
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="footer-top-btn"
            title="Yuqoriga qaytish"
          >
            <span>Yuqoriga</span>
            <FaArrowUp className="footer-top-btn-icon" />
          </button>
        </div>
      </div>
    </footer>
  );
}
