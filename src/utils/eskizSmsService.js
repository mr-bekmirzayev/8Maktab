// =============================================================================
// eskizSmsService.js
// Eskiz.uz SMS API bilan ishlash uchun xizmat moduli.
//
// SMS yuborish /api/send-sms orqali amalga oshiriladi:
// - Vercel da: Vercel Serverless Function orqali ishlaydi.
// - Localhost da: Vite dev server middleware orqali Node.js da ishlaydi (CORS-siz).
//
// Bu faylda Eskiz tokeni yoki paroli SAQLANMAYDI — ular faqat serverda.
// =============================================================================

import { auth } from "../firebase";

const SMS_API_URL = "/api/send-sms";
const REQUEST_TIMEOUT_MS = 45000;

/**
 * Telefon raqamini 998XXXXXXXXX ko'rinishiga keltiradi.
 * Noto'g'ri raqam bo'lsa null qaytaradi.
 *
 * @param {string} phone
 * @returns {string|null}
 */
export function normalizeUzPhone(phone) {
  if (phone === null || phone === undefined) return null;

  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 13 && digits.startsWith("8")) digits = digits.slice(1);
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = "998" + digits.slice(1);
  }
  if (digits.length === 9) digits = "998" + digits;

  if (digits.length !== 12 || !digits.startsWith("998")) return null;

  const operator = digits.slice(3, 5);
  if (!/^(?:20|33|50|55|6[1-9]|7[0-9]|88|9[0-9])$/.test(operator)) {
    return null;
  }

  return digits;
}

/**
 * Emoji va GSM-7 qo'llab-quvvatlamaydigan belgilarni almashtiradi.
 * Emoji ishlatilsa SMS UCS-2 ga o'tadi va narx oshadi.
 */
function toGsmSafe(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u02BB\u02BC`´]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clampText(value, maxLength) {
  const text = toGsmSafe(value);
  if (text.length <= maxLength) return text;
  return text.slice(0, Math.max(0, maxLength - 3)).trimEnd() + "...";
}

/**
 * Yangilik haqida o'qituvchilarga SMS yuboradi.
 *
 * @param {{ title: string, description?: string, demand?: string, date?: string, author?: string, newsId?: string, phones?: string[] }} newsData
 * @returns {Promise<{ success: boolean, sentTo?: number, failed?: number, invalidCount?: number, errors?: string[], message?: string }>}
 */
export async function sendNewsSmsThroughVercel(newsData) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Faqat to'g'ri formatdagi va takrorlanmagan raqamlarni yuboramiz
  const phones = Array.isArray(newsData.phones)
    ? [...new Set(newsData.phones.map(normalizeUzPhone).filter(Boolean))]
    : undefined;

  try {
    // Admin tizimga kirgan bo'lsa, serverda tekshirish uchun ID token yuboramiz
    let idToken = null;
    try {
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (tokenError) {
      console.warn("Admin ID token olinmadi:", tokenError);
    }

    const headers = { "Content-Type": "application/json" };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const response = await fetch(SMS_API_URL, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        newsId: newsData.newsId || null,
        title: newsData.title,
        description: newsData.description || "",
        demand: newsData.demand || "",
        date: newsData.date || "",
        author: newsData.author || "",
        phones,
      }),
    });

    const text = await response.text();
    let json = null;

    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(
        `Server noto'g'ri javob qaytardi (${response.status}). ` +
          "Vite dev serverni qayta ishga tushiring (npm run dev) yoki Vercel deployni tekshiring."
      );
    }

    if (!response.ok) {
      throw new Error(json?.error || `Server xatosi: ${response.status}`);
    }

    return json;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "SMS serveri javob bermadi (timeout). Internet aloqasini tekshirib, qayta urinib ko'ring.",
        { cause: error }
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Yangilik ma'lumotlari asosida qisqa, tartibli va GSM-7 mos SMS matnini yasaydi.
 * Emoji ishlatilmaydi — aks holda SMS UCS-2 ga o'tib, narx oshadi.
 *
 * @param {{ title: string, description?: string, demand?: string, date?: string, author?: string }} param0
 * @returns {string}
 */
export function buildSmsText({ title, description, demand, date, author }) {
  const site = "8-maktab.vercel.app";
  const lines = ["8-MAKTAB YANGILIGI"];

  if (title && String(title).trim()) {
    lines.push(`Mavzu: ${clampText(title, 90)}`);
  }

  if (description && String(description).trim()) {
    lines.push(`Tavsif: ${clampText(description, 130)}`);
  }

  if (demand && String(demand).trim()) {
    lines.push(`Talab: ${clampText(demand, 80)}`);
  }

  if (date && String(date).trim()) {
    lines.push(`Sana: ${clampText(date, 20)}`);
  }

  if (author && String(author).trim()) {
    lines.push(`Muallif: ${clampText(author, 40)}`);
  }

  lines.push(`Batafsil: ${site}`);

  const text = lines.join("\n").trim();
  return text.length > 300 ? text.slice(0, 297).trimEnd() + "..." : text;
}
