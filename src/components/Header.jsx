import React, { useEffect, useState, useCallback } from "react";
import { FaRegNewspaper } from "react-icons/fa";
import { GoHome } from "react-icons/go";
import { TbExclamationCircle } from "react-icons/tb";
import { Link, NavLink, useLocation } from "react-router-dom";
import { GiBookCover } from "react-icons/gi";
import { PiChalkboardTeacherFill } from "react-icons/pi";
import { IoMenu, IoClose } from "react-icons/io5";
import { RiFullscreenLine } from "react-icons/ri";
import { BsFullscreenExit } from "react-icons/bs";
import "./Header.css";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let scrolled = window.scrollY > 40;
    const handleScroll = () => {
      const isPast = window.scrollY > 40;
      if (isPast !== scrolled) {
        scrolled = isPast;
        setIsScrolled(isPast);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Sahifa o'zgarganda mobil menyuni avtomatik yopish
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Mobil menyu ochiq turganda orqa fon skrollini to'xtatish
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Fullscreen holati brauzerda o'zgarganda (Esc, F11 yoki button orqali) kuzatish
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
    };
  }, []);

  // To'liq ekranga kirish/chiqish funksiyasi
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.() ??
        document.documentElement.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ?? document.webkitExitFullscreen?.();
    }
  }, []);

  return (
    <header className={`display ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-inner">
        <Link
          title="Logo"
          aria-label="8 - Maktabning logotipi"
          className="header-logo-link"
          to={"/"}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="header-logo-box">
            <GiBookCover className="bookIconInHeader" />
            <div className="header-school-num-box">
              <span className="header-school-num">8</span>
            </div>
            <div className="header-school-text-box">
              <h3 className="header-school-city">Namangan</h3>
              <hr className="header-school-divider" />
              <h3 className="header-school-region">Uychi</h3>
              <h3 className="header-school-type">maktab</h3>
            </div>
          </div>
        </Link>

        {/* Desktop Navigatsiya */}
        <nav className="desktop-nav">
          <ul className="nav-links-list">
            <li>
              <NavLink
                title="Asosiy Sahifa"
                aria-label="Asosiy Sahifa"
                to={"/"}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <GoHome className="nav-icon" />
                <span>Asosiy sahifa</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                title="Biz Haqqimizda"
                aria-label="Biz haqqimizda"
                to={"/about"}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <TbExclamationCircle className="nav-icon" />
                <span>Biz haqqimizda</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={"/news"}
                title="Yangiliklar"
                aria-label="Yangiliklar"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <FaRegNewspaper className="nav-icon" />
                <span>Yangiliklar</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={"/teachers"}
                title="Ustozlar"
                aria-label="Ustozlar"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <PiChalkboardTeacherFill className="nav-icon" />
                <span>Ustozlar</span>
              </NavLink>
            </li>
            {isFullscreen ? (
              <li
                className="nav-link"
                onClick={toggleFullscreen}
                style={{ cursor: "pointer" }}
                title="To'liq ekrandan chiqish"
              >
                <BsFullscreenExit size={"18px"} />
              </li>
            ) : (
              <li
                className="nav-link"
                onClick={toggleFullscreen}
                style={{ cursor: "pointer" }}
                title="To'liq ekran"
              >
                <RiFullscreenLine className="doFullScreen nav-icon" />
              </li>
            )}
          </ul>
        </nav>

        {/* Mobil Gamburger Tugmasi */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
        >
          {isMobileMenuOpen ? <IoClose size={28} /> : <IoMenu size={28} />}
        </button>
      </div>

      {/* Mobil Menyu Drawer / Overlay */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className="mobile-menu-drawer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-menu-header">
            <span className="mobile-menu-title">Bo'limlar</span>
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <IoClose size={24} />
            </button>
          </div>

          <ul className="mobile-nav-links">
            <li>
              <NavLink
                to={"/"}
                className={({ isActive }) =>
                  isActive ? "mobile-nav-link active" : "mobile-nav-link"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <GoHome className="mobile-nav-icon" />
                <span>Asosiy sahifa</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={"/about"}
                className={({ isActive }) =>
                  isActive ? "mobile-nav-link active" : "mobile-nav-link"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TbExclamationCircle className="mobile-nav-icon" />
                <span>Biz haqqimizda</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={"/news"}
                className={({ isActive }) =>
                  isActive ? "mobile-nav-link active" : "mobile-nav-link"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaRegNewspaper className="mobile-nav-icon" />
                <span>Yangiliklar</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={"/teachers"}
                className={({ isActive }) =>
                  isActive ? "mobile-nav-link active" : "mobile-nav-link"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <PiChalkboardTeacherFill className="mobile-nav-icon" />
                <span>Ustozlar</span>
              </NavLink>
            </li>
            <li>
              <div
                className="mobile-nav-link"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  toggleFullscreen();
                  setIsMobileMenuOpen(false);
                }}
              >
                {isFullscreen ? (
                  <>
                    <BsFullscreenExit className="mobile-nav-icon" />
                    <span>To'liq ekrandan chiqish</span>
                  </>
                ) : (
                  <>
                    <RiFullscreenLine className="mobile-nav-icon" />
                    <span>To'liq ekran</span>
                  </>
                )}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <span className="header-glow" aria-hidden="true" />
    </header>
  );
}
