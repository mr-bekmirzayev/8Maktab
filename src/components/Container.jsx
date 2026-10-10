import React from "react";
import "./Container.css";

/**
 * Saytning barcha sahifalari va sectionlari uchun universal Konteyner komponenti.
 * Ekran kattalashganda yoki uzoqlashganda kontentni bitta tekis vertikal chiziqda
 * (max-width: 1360px, margin: 0 auto) ushlab turadi.
 */
export default function Container({
  children,
  className = "",
  style = {},
  as: Component = "div",
  fluid = false,
  narrow = false,
  wide = false,
  ...props
}) {
  const sizeClass = fluid
    ? "container-fluid"
    : narrow
    ? "container-narrow"
    : wide
    ? "container-wide"
    : "";

  return (
    <Component
      className={`app-container-box ${sizeClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}
