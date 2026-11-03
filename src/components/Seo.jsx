import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://8-maktab.vercel.app";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const SCHOOL_DESCRIPTION =
  "Namangan viloyati Uychi tumani 8-sonli umumiy o'rta ta'lim maktabining shaxsiy veb-sayti. Maktab yangiliklari, e'lonlar, bildirishnomalar va ustozlar tarkibi.";

const ROUTE_META = {
  "/": {
    title:
      "8-maktab | Uychi tumani maktabgacha va maktab ta'limi bo'limi",
    description: SCHOOL_DESCRIPTION,
    keywords:
      "uychi 8-maktab, 8-maktab uychi, uychi maktablari, uychi 8 maktab veb sayti, rovot 8-maktab",
    index: true,
  },
  "/about": {
    title: "Maktab haqida | 8-maktab — Uychi tumani",
    description:
      "Uychi tumani 8-sonli maktab tarixi, ustozlar jamoasi, ta'lim yo'nalishlari, yutuqlari va maktab binosi haqida ma'lumot.",
    keywords:
      "uychi 8-maktab haqida, 8-maktab tarixi, uychi maktablari, namangan 8-maktab, rovot 8-maktab",
    index: true,
  },
  "/news": {
    title: "Yangiliklar va e'lonlar | 8-maktab — Uychi tumani",
    description:
      "Uychi tumani 8-sonli maktabning so'nggi yangiliklari, e'lonlari va o'quvchilar hayotidan muhim xabarlar.",
    keywords:
      "uychi 8-maktab yangiliklari, maktab e'lonlari, 8-maktab uychi, uychi maktablari",
    index: true,
  },
  "/teachers": {
    title: "Ustozlar tarkibi | 8-maktab — Uychi tumani",
    description:
      "Uychi tumani 8-sonli maktab ustozlari, ularning fan yo'nalishlari, toifalari va pedagogik tajribasi.",
    keywords:
      "uychi 8-maktab ustozlari, 8-maktab o'qituvchilari, uychi maktablari, namangan ustozlar",
    index: true,
  },
};

const NOT_FOUND_META = {
  title: "Sahifa topilmadi | 8-maktab",
  description: "Kechirasiz, siz izlagan sahifa mavjud emas.",
  keywords: "",
  index: false,
};

function upsertMeta(attribute, key, content) {
  if (!content && content !== "") return;

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

/**
 * SPA sahifalari uchun sarlavha, description, canonical va OpenGraph
 * teglarini joriy route asosida yangilaydi.
 */
export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath =
      pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
    const meta = ROUTE_META[normalizedPath] || NOT_FOUND_META;

    const canonicalPath = normalizedPath;
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;

    document.title = meta.title;

    upsertMeta("name", "description", meta.description);
    upsertMeta("name", "keywords", meta.keywords);
    upsertMeta(
      "name",
      "robots",
      meta.index
        ? "index, follow, max-image-preview:large, max-snippet:-1"
        : "noindex, follow"
    );

    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", DEFAULT_IMAGE);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", "uz_UZ");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", meta.title);
    upsertMeta("name", "twitter:description", meta.description);
    upsertMeta("name", "twitter:image", DEFAULT_IMAGE);

    upsertLink("canonical", canonicalUrl);
  }, [pathname]);

  return null;
}
