import "./App.css";
import AppRouter from "./AppRouter";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import GlobalNewsNotifier from "./components/GlobalNewsNotifier";
import NetworkStatusNotifier from "./components/NetworkStatusNotifier";
import { BiBookBookmark } from "react-icons/bi";
import { FaTimes } from "react-icons/fa";
import { RiFullscreenLine } from "react-icons/ri";
import Footer from "./components/Footer";
import { useLocation } from "react-router-dom";

function App() {
  const [isShadowHidden, setIsShadowHidden] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Fullscreen bildirishnomasi yopilganligini localStorage dan tekshirish
  const [isFullScreenNotifClosed, setIsFullScreenNotifClosed] = useState(() => {
    return localStorage.getItem("clsfm") === "true";
  });

  // Animatsiyali yopilish holati
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let shadowHidden = window.scrollY > 40;
    const handleScroll = () => {
      const isPast = window.scrollY > 40;
      if (isPast !== shadowHidden) {
        shadowHidden = isPast;
        setIsShadowHidden(isPast);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isInfoOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isInfoOpen]);

  // X (yopish) tugmasi bosilganda animatsiya bilan yopish va localStorage ga saqlash
  const handleCloseNotif = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsFullScreenNotifClosed(true);
      localStorage.setItem("clsfm", "true");
    }, 400);
  };

  // Banner kartasiga bosilganda to'liq ekranga o'tish
  const handleNotifClick = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.() ??
        document.documentElement.webkitRequestFullscreen?.();
    }
  };
  const location = useLocation();
  const showFooterPaths = ["/", "/about", "/new"];
  const shouldShowFooter = showFooterPaths.includes(location.pathname);

  const showHeaderPaths = ["/", "/about", "/news"]; // o'zingizga kerakli sahifalarni yozasiz
  const shouldShowHeader = showHeaderPaths.includes(location.pathname);

  return (
    <div className={`app-container ${isInfoOpen ? "info-modal-open" : ""}`}>
      {!isFullScreenNotifClosed && (
        <div
          className={`fullscreenFather ${isExiting ? "exiting" : ""}`}
          role="alert"
        >
          <div
            className="fullscreenCard"
            onClick={handleNotifClick}
            title="To'liq ekranga o'tish uchun bosing"
          >
            <div className="fullscreenIconBox">
              <RiFullscreenLine className="fullscreenPulseIcon" />
            </div>
            <div className="fullscreenTextBox">
              <span className="fullscreenBadge">Tavsiya</span>
              <h4 className="fullscreenMessage">
                Ilova sizga yanada chiroyli ko'rinishi uchun{" "}
                <strong>fullscreen (to'liq ekran)</strong> rejimiga
                o'tishingizni tavsiya etamiz
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCloseNotif();
            }}
            className="fullNotButton"
            aria-label="Yopish"
            title="Yopish"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <GlobalNewsNotifier />
      <NetworkStatusNotifier />
      <div className={`shadowBlue ${isShadowHidden ? "hidden" : ""}`}></div>
      <div className={`app-content ${isInfoOpen ? "blurred" : ""}`}>
        {shouldShowHeader && <Header />}

        <AppRouter />

        {/* Agar joriy yo'l massivda BO'LSA, Footer chiqadi */}
        {shouldShowFooter && <Footer />}
      </div>

      <BiBookBookmark
        onClick={() => setIsInfoOpen(true)}
        className="bookTwoInHeader"
        aria-label="Maktab haqida ma'lumot"
        title="Maktab haqida ma'lumot"
      />

      {isInfoOpen && (
        <div
          className="school-info-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="school-info-title"
        >
          <div className="school-info-modal">
            <button
              type="button"
              className="school-info-close"
              onClick={() => setIsInfoOpen(false)}
              aria-label="Yopish"
            >
              ×
            </button>
            <p className="school-info-kicker">Maktab haqida</p>
            <h2 id="school-info-title">8-Maktab</h2>
            <p>
              Maktabimiz o'quvchilar uchun qulay, bilimga yo'naltirilgan va
              ma'naviy rivojlanishga xizmat qiluvchi ta'lim muhitini yaratishga
              intiladi.
            </p>
            <p>
              Bu yerda har bir talaba bilim, madaniyat, mas'uliyat va jamiyatga
              foydali faoliyatga tayyorlanadi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
