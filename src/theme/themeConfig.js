// Mavzu (theme) konfiguratsiyasi.
// Barcha variantlar qora fon + oq matn sxemasiga tayanadi,
// faqat aksent ohangi farq qiladi.
// `gold` — saytning avvalgi (sarg'ish) ko'rinishi va standart mavzu.

export const THEMES = [
  {
    id: "gold",
    name: "Oltin",
    hint: "Standart",
    swatch: "#f97316",
    swatchDark: "#ea580c",
    meta: "#140b02",
  },
  {
    id: "blue",
    name: "To'q ko'k",
    hint: "Klassik",
    swatch: "#2563eb",
    swatchDark: "#1d4ed8",
    meta: "#020617",
  },
  {
    id: "sky",
    name: "Moviy",
    hint: "Yorqin",
    swatch: "#38bdf8",
    swatchDark: "#0ea5e9",
    meta: "#03141f",
  },
  {
    id: "indigo",
    name: "Indigo",
    hint: "Chuqur",
    swatch: "#6366f1",
    swatchDark: "#4338ca",
    meta: "#0a0720",
  },
];

export const STORAGE_KEY = "8maktab-theme";
export const DEFAULT_THEME = "gold";
export const SWITCH_DURATION_MS = 850;

export function isKnownTheme(themeId) {
  return THEMES.some((theme) => theme.id === themeId);
}

export function getStoredTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isKnownTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
