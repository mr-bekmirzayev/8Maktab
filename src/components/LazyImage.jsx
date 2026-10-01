import React, { useState, useRef, useEffect } from "react";
import "./LazyImage.css";

export default function LazyImage({
  src,
  alt = "",
  className = "",
  style = {},
  onLoad,
  onError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setIsLoaded(true);
    if (onError) onError(e);
  };

  const originalFilter = style.filter || "";
  const combinedFilter = isLoaded
    ? originalFilter
    : `${originalFilter} blur(12px) brightness(0.8)`.trim();

  const combinedStyle = {
    ...style,
    filter: combinedFilter,
    opacity: isLoaded ? 1 : 0.65,
    transition: style.transition
      ? `${style.transition}, filter 0.4s ease, opacity 0.4s ease`
      : "filter 0.4s ease, opacity 0.4s ease",
  };

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      className={`${className} ${isLoaded ? "img-loaded" : "img-loading"}`.trim()}
      style={combinedStyle}
      loading="lazy"
      {...props}
    />
  );
}
