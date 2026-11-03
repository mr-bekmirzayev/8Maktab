import { useEffect, useRef, useState } from "react";
import { IoCheckmark, IoColorPaletteOutline } from "react-icons/io5";
import { useTheme } from "../theme/useTheme";
import "./ThemeSwitcher.css";

/**
 * Mavzu tanlagichi.
 *
 * - `inline` bo'lmasa: bosilganda ochiladigan kichik menyu (desktop uchun).
 * - `inline` bo'lsa: variantlar doim ko'rinib turadi (mobil menyu uchun).
 */
export default function ThemeSwitcher({ inline = false }) {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (inline || !isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [inline, isOpen]);

  const handleSelect = (themeId) => {
    setTheme(themeId);
    if (!inline) setIsOpen(false);
  };

  const options = (
    <div
      className={`theme-options ${inline ? "theme-options--inline" : ""}`}
      role="radiogroup"
      aria-label="Sayt mavzusi"
    >
      {themes.map((item) => {
        const isActive = item.id === theme;

        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`theme-option ${isActive ? "is-active" : ""}`}
            onClick={() => handleSelect(item.id)}
          >
            <span
              className="theme-swatch"
              style={{
                background: `linear-gradient(135deg, ${item.swatch}, ${item.swatchDark})`,
              }}
              aria-hidden="true"
            />
            <span className="theme-option-text">
              <span className="theme-option-name">{item.name}</span>
              <span className="theme-option-hint">{item.hint}</span>
            </span>
            <span className="theme-option-check" aria-hidden="true">
              {isActive ? <IoCheckmark size={16} /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (inline) {
    return (
      <div className="theme-switcher theme-switcher--inline">
        <span className="theme-inline-label">Mavzu</span>
        {options}
      </div>
    );
  }

  return (
    <div className="theme-switcher" ref={containerRef}>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Mavzuni tanlash"
        title="Mavzuni tanlash"
      >
        <IoColorPaletteOutline size={19} />
      </button>

      {isOpen && (
        <div className="theme-popover" role="dialog" aria-label="Mavzu tanlash">
          <span className="theme-popover-title">Mavzu</span>
          {options}
        </div>
      )}
    </div>
  );
}
