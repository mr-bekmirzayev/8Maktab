import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FiMapPin,
  FiCompass,
  FiExternalLink,
  FiRefreshCw,
} from "react-icons/fi";

/**
 * 8-MAKTABNING HAQIQIY GEO-KOORDINATALARI
 * Google Maps havolasidan olingan aniq joylashuv:
 * https://maps.app.goo.gl/FuME6o2akTVj29RP9
 * Plus Code: 8JHJ32Q5+99 / 32Q5+62R, Uzbekistan
 */
const TARGET_LOCATION = {
  lat: 41.08845,
  lng: 72.00848,
  title: "8-Umumta'lim Maktabi",
  region: "Namangan viloyati, Uychi tumani",
  address: "Uychi tumani, 8-sonli umumta'lim maktabi",
  googleMapsUrl: "https://maps.app.goo.gl/FuME6o2akTVj29RP9",
};

/**
 * PARVOZ BOSQICHLARI (Koinot/Dunyo -> O'zbekiston -> Namangan -> Uychi -> 8-Maktab)
 */
const FLIGHT_STAGES = [
  { step: 0, name: "Global Orbit", desc: "Koinot orbitasi skaneri...", lat: 28.0, lng: 20.0, zoom: 3 },
  { step: 1, name: "Uzbekistan", desc: "O'zbekiston havo hududiga kirish...", lat: 41.3775, lng: 64.5853, zoom: 6 },
  { step: 2, name: "Namangan Region", desc: "Namangan viloyati aniqlandi...", lat: 41.0011, lng: 71.6726, zoom: 11 },
  { step: 3, name: "Uychi", desc: "Uychi tumani sektoriga tushish...", lat: 41.0885, lng: 72.0085, zoom: 14.5 },
  { step: 4, name: "Ajoyib", desc: "8-Maktab nuqtasi belgilandi", lat: TARGET_LOCATION.lat, lng: TARGET_LOCATION.lng, zoom: 17.5 },
];

export default function SchoolGeoMap({ compact = false }) {
  const containerRef = useRef(null);
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [hasTriggered, setHasTriggered] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [telemetry, setTelemetry] = useState({
    lat: FLIGHT_STAGES[0].lat,
    lng: FLIGHT_STAGES[0].lng,
    zoom: FLIGHT_STAGES[0].zoom,
  });

  // 1. Leaflet CSS va JS ni eng yengil tarzda CDN orqali xavfsiz yuklash
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      if (window.L) {
        if (isMounted) setMapLoaded(true);
        return;
      }

      // CSS ulash
      if (!document.getElementById("leaflet-css-bundle")) {
        const link = document.createElement("link");
        link.id = "leaflet-css-bundle";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // JS ulash
      if (!document.getElementById("leaflet-js-bundle")) {
        const script = document.createElement("script");
        script.id = "leaflet-js-bundle";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => {
          if (isMounted) setMapLoaded(true);
        };
        document.body.appendChild(script);
      } else {
        const existingScript = document.getElementById("leaflet-js-bundle");
        existingScript.addEventListener("load", () => {
          if (isMounted) setMapLoaded(true);
        });
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Parvoz animatsiyasini bosqichma-bosqich boshqarish
  const executeFlightAnimation = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    setIsFlying(true);
    setCurrentStage(0);

    // Boshlang'ich nuqta: Koinot/Uzoq Yer shari ko'rinishi
    map.setView([FLIGHT_STAGES[0].lat, FLIGHT_STAGES[0].lng], FLIGHT_STAGES[0].zoom, {
      animate: false,
    });

    if (markerRef.current) markerRef.current.remove();

    // 1-bosqich: O'zbekistonga uchish
    setTimeout(() => {
      setCurrentStage(1);
      map.flyTo([FLIGHT_STAGES[1].lat, FLIGHT_STAGES[1].lng], FLIGHT_STAGES[1].zoom, {
        duration: 2.2,
        easeLinearity: 0.25,
      });
    }, 1000);

    // 2-bosqich: Namangan viloyati
    setTimeout(() => {
      setCurrentStage(2);
      map.flyTo([FLIGHT_STAGES[2].lat, FLIGHT_STAGES[2].lng], FLIGHT_STAGES[2].zoom, {
        duration: 2.0,
        easeLinearity: 0.3,
      });
    }, 3400);

    // 3-bosqich: Uychi tumani
    setTimeout(() => {
      setCurrentStage(3);
      map.flyTo([FLIGHT_STAGES[3].lat, FLIGHT_STAGES[3].lng], FLIGHT_STAGES[3].zoom, {
        duration: 1.8,
        easeLinearity: 0.35,
      });
    }, 5500);

    // 4-bosqich: 8-Maktab yakuniy nishonga to'xtash va Neon Pin porlashi
    setTimeout(() => {
      setCurrentStage(4);
      map.flyTo([TARGET_LOCATION.lat, TARGET_LOCATION.lng], FLIGHT_STAGES[4].zoom, {
        duration: 1.6,
        easeLinearity: 0.4,
      });

      // Neon Cyber Marker yaratish
      setTimeout(() => {
        setIsFlying(false);

        const neonIcon = window.L.divIcon({
          className: "custom-cyber-marker",
          html: `
            <div class="cyber-pin-wrapper">
              <div class="cyber-pulse-core"></div>
              <div class="cyber-pulse-ring ring-1"></div>
              <div class="cyber-pulse-ring ring-2"></div>
              <div class="cyber-pin-badge">
                <span class="badge-dot"></span>
                <span class="badge-text">8-MAKTAB</span>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        markerRef.current = window.L.marker([TARGET_LOCATION.lat, TARGET_LOCATION.lng], {
          icon: neonIcon,
        }).addTo(map);

        markerRef.current
          .bindPopup(
            `
            <div class="cyber-popup-card">
              <div class="popup-tag">DAVLAT TA'LIM MUASSASASI</div>
              <h3 class="popup-title">8-Sonli Umumta'lim Maktabi</h3>
              <p class="popup-desc">${TARGET_LOCATION.address}</p>
              <div class="popup-meta">
                <span>📍 Koordinata: 41.08845° N, 72.00848° E</span>
              </div>
            </div>
          `,
            { className: "cyber-dark-popup", closeButton: false }
          )
          .openPopup();
      }, 1600);
    }, 7400);
  }, []);

  // 3. Xaritani initsializatsiya qilish (OpenStreetMap + 100% BEPUL va API Kalitsiz Dark Mode)
  useEffect(() => {
    if (!mapLoaded || !mapElementRef.current || mapInstanceRef.current || !window.L) return;

    const map = window.L.map(mapElementRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
    }).setView([FLIGHT_STAGES[0].lat, FLIGHT_STAGES[0].lng], FLIGHT_STAGES[0].zoom);

    // 100% BEPUL, YUQORI ANIKLIKDAGI HAQIQIY SUN'IY YO'LDOSH (SPUTNIK / SATELLITE) TASVIRI
    window.L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Esri Satellite",
      }
    ).addTo(map);

    // Zoom o'zgarganda telemetriyani yangilab turish
    map.on("move", () => {
      const center = map.getCenter();
      setTelemetry({
        lat: Number(center.lat.toFixed(4)),
        lng: Number(center.lng.toFixed(4)),
        zoom: Number(map.getZoom().toFixed(1)),
      });
    });

    mapInstanceRef.current = map;
    setIsReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapLoaded]);

  // 4. Scroll qilinganda (Intersection Observer) avtomatik ishga tushish
  useEffect(() => {
    if (!containerRef.current || !isReady || hasTriggered) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true);
          executeFlightAnimation();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [isReady, hasTriggered, executeFlightAnimation]);

  return (
    <section
      ref={containerRef}
      style={{
        position: "relative",
        padding: compact ? "40px 16px" : "80px 16px 100px",
        maxWidth: "1880px",
        margin: "0 auto",
        zIndex: 2, backdropFilter: "blur(20px)", background: "rgba(15, 23, 42, 0.75)", borderRadius: "24px", border: "1px solid rgba(249, 115, 22, 0.3)",
      }}
    >
      {/* SECTION HEADER */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "999px",
            background: "rgba(249, 115, 22, 0.12)",
            border: "1px solid rgba(249, 115, 22, 0.3)",
            color: "#fb923c",
            fontSize: "12.5px",
            fontWeight: "700",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          <FiCompass className="cyber-spin-slow" /> Interaktiv Geo-Lokatsiya
        </div>

        <h2
          style={{
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: "800",
            color: "#f8fafc",
            margin: "0 0 10px",
            letterSpacing: "-0.5px",
          }}
        >
          Maktabimiz <span style={{ color: "#f97316" }}>Qayerda Joylashgan?</span>
        </h2>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "15px",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Global orbitadan to Uychi tumani qishlog'idagi 8-maktab binosigacha bo'lgan silliq kinematik
          parvoz orqali manzilimizni aniqlang.
        </p>
      </div>

      {/* MAP WRAPPER (CYBER-HUD FRAME) */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: compact ? "420px" : "560px",
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid rgba(249, 115, 22, 0.35)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(249, 115, 22, 0.15)",
          background: "#080c14",
        }}
      >
        {/* LEAFLET CONTAINER */}
        <div
          ref={mapElementRef}
          style={{
            width: "100%",
            height: "100%",
            background: "#070b14",
            zIndex: 1,
          }}
        />

        {/* CYBER GRID OVERLAY */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 2,
            backgroundImage:
              "radial-gradient(circle at center, transparent 40%, rgba(7, 11, 20, 0.75) 100%), linear-gradient(rgba(249, 115, 22, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.03) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 40px 40px, 40px 40px",
          }}
        />

        {/* HUD: TOP STATUS BAR */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            right: "16px",
            zIndex: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            pointerEvents: "none",
          }}
        >
          {/* Parvoz holati bildirishnomasi */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 16px",
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(249, 115, 22, 0.35)",
              borderRadius: "14px",
              color: "#f8fafc",
              fontSize: "13px",
              pointerEvents: "auto",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isFlying ? "#f97316" : "#22c55e",
                boxShadow: isFlying
                  ? "0 0 10px #f97316"
                  : "0 0 10px #22c55e",
                animation: isFlying ? "pulse-dot 1s infinite" : "none",
              }}
            />
            <span style={{ fontWeight: "700", color: "#fb923c" }}>
              {FLIGHT_STAGES[currentStage]?.name}:
            </span>
            <span style={{ color: "#cbd5e1" }}>
              {FLIGHT_STAGES[currentStage]?.desc}
            </span>
          </div>

          {/* Telemetriya ko'rsatkichlari */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "8px 14px",
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "14px",
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#94a3b8",
              pointerEvents: "auto",
            }}
          >
            <span>LAT: <strong style={{ color: "#f8fafc" }}>{telemetry.lat}°</strong></span>
            <span>|</span>
            <span>LNG: <strong style={{ color: "#f8fafc" }}>{telemetry.lng}°</strong></span>
            <span>|</span>
            <span>ZOOM: <strong style={{ color: "#fb923c" }}>{telemetry.zoom}x</strong></span>
          </div>
        </div>

        {/* HUD: BOTTOM CONTROL BAR */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            right: "16px",
            zIndex: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Manzil kartochkasi */}
          <div
            style={{
              padding: "12px 18px",
              background: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              borderRadius: "16px",
              color: "#f8fafc",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.4)",
              }}
            >
              <FiMapPin size={18} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>
                8-Maktab (Uychi tumani)
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                {TARGET_LOCATION.address}
              </div>
            </div>
          </div>

          {/* Tugmalar guruhi */}
          <div style={{ display: "flex", gap: "10px" }}>
            {/* Parvozni qayta boshlash */}
            <button
              type="button"
              onClick={executeFlightAnimation}
              disabled={isFlying}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: isFlying
                  ? "rgba(30, 41, 59, 0.6)"
                  : "linear-gradient(135deg, #ea580c, #f97316)",
                border: "none",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: isFlying ? "not-allowed" : "pointer",
                boxShadow: isFlying
                  ? "none"
                  : "0 4px 16px rgba(249, 115, 22, 0.4)",
                transition: "all 0.2s ease",
              }}
            >
              <FiRefreshCw className={isFlying ? "cyber-spin-fast" : ""} size={14} />
              {isFlying ? "Kuting..." : "Qayta Aniqlash"}
            </button>

            {/* Google Maps havolasi */}
            <a
              href={TARGET_LOCATION.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                background: "rgba(15, 23, 42, 0.85)",
                border: "1px solid rgba(148, 163, 184, 0.25)",
                borderRadius: "12px",
                color: "#cbd5e1",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                backdropFilter: "blur(10px)",
                transition: "all 0.2s ease",
              }}
            >
              Google Maps <FiExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* EMBEDDED CYBER STYLES */}
      <style>{`
        /* Haqiqiy Sputnik tasviri uchun toza kontrast */
        .leaflet-tile-pane {
          filter: contrast(1.08) brightness(0.95);
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.3); }
        }
        @keyframes cyber-pulse-expand {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .cyber-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        .cyber-spin-fast {
          animation: spin-slow 1s linear infinite;
        }

        /* Marker Neon Styles */
        .custom-cyber-marker {
          position: relative;
        }
        .cyber-pin-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
        }
        .cyber-pulse-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #f97316;
          box-shadow: 0 0 16px #f97316, 0 0 32px #ea580c;
          border: 3px solid #ffffff;
          z-index: 3;
        }
        .cyber-pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #f97316;
          pointer-events: none;
          animation: cyber-pulse-expand 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }
        .cyber-pulse-ring.ring-2 {
          animation-delay: 0.8s;
        }
        .cyber-pin-badge {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid #f97316;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);
          white-space: nowrap;
          pointer-events: none;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }
        .badge-text {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #f8fafc;
        }

        /* Popup Styles */
        .cyber-dark-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(249, 115, 22, 0.4);
          border-radius: 14px;
          color: #f8fafc;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.8);
          padding: 4px;
        }
        .cyber-dark-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
        }
        .cyber-popup-card {
          padding: 8px 6px;
        }
        .popup-tag {
          font-size: 10px;
          font-weight: 700;
          color: #fb923c;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .popup-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 6px;
        }
        .popup-desc {
          font-size: 12px;
          color: #94a3b8;
          margin: 0 0 8px;
          line-height: 1.4;
        }
        .popup-meta {
          font-size: 11px;
          font-family: monospace;
          color: #38bdf8;
        }
      `}</style>
    </section>
  );
}
