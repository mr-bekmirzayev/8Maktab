import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeContext } from "./ThemeContext";
import {
  DEFAULT_THEME,
  STORAGE_KEY,
  SWITCH_DURATION_MS,
  THEMES,
  getStoredTheme,
  isKnownTheme,
} from "./themeConfig";

function syncThemeColorMeta(themeId) {
  const theme = THEMES.find((item) => item.id === themeId);
  if (!theme) return;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.meta);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const themeRef = useRef(theme);
  const timerRef = useRef(null);

  // Birinchi renderdan keyin ham holatni <html> ga qo'llab qo'yamiz
  useEffect(() => {
    themeRef.current = theme;

    document.documentElement.setAttribute("data-theme", theme);
    syncThemeColorMeta(theme);

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* localStorage mavjud bo'lmasa e'tiborsiz qoldiramiz */
    }
  }, [theme]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const setTheme = useCallback((nextThemeId) => {
    if (!isKnownTheme(nextThemeId)) return;
    if (themeRef.current === nextThemeId) return;

    const root = document.documentElement;

    // Silliq o'tish uchun klassni oldindan qo'shamiz va uslubni majburan
    // qayta hisoblaymiz, so'ng data-theme ni almashtiramiz.
    root.classList.add("theme-switching");
    void root.offsetWidth;

    root.setAttribute("data-theme", nextThemeId);
    syncThemeColorMeta(nextThemeId);

    themeRef.current = nextThemeId;
    setThemeState(nextThemeId);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      root.classList.remove("theme-switching");
    }, SWITCH_DURATION_MS);
  }, []);

  const value = useMemo(
    () => ({
      theme: theme || DEFAULT_THEME,
      setTheme,
      themes: THEMES,
    }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
