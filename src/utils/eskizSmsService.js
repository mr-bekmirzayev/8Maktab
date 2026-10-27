// =============================================================================
// eskizSmsService.js
// Eskiz.uz SMS API bilan ishlash uchun xizmat moduli.
//
// SMS yuborish /api/send-sms orqali amalga oshiriladi:
// - Vercel da: Vercel Serverless Function orqali ishlaydi.
// - Localhost da: Vite dev server middleware orqali Node.js da ishlaydi (CORS-siz).
// =============================================================================

const VERCEL_SMS_URL = "/api/send-sms";

/**
 * Yangilik haqida o'qituvchilarga SMS yuboradi.
 *
 * @param {{ title: string, description?: string, demand?: string, date?: string, author?: string, newsId?: string, phones?: string[] }} newsData
 * @returns {Promise<{ success: boolean, sentTo?: number, failed?: number, errors?: string[], message?: string }>}
 */
export async function sendNewsSmsThroughVercel(newsData) {
  const response = await fetch(VERCEL_SMS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newsId: newsData.newsId || null,
      title: newsData.title,
      description: newsData.description || "",
      demand: newsData.demand || "",
      date: newsData.date || "",
      author: newsData.author || "",
      phones: Array.isArray(newsData.phones) ? newsData.phones : undefined,
    }),
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `Server javob bermadi (${response.status}). Vite dev serverni qayta ishga tushiring (npm run dev).`
    );
  }

  if (!response.ok) {
    throw new Error(json?.error || `Server xatosi: ${response.status}`);
  }

  return json;
}

/**
 * Yangilik ma'lumotlari asosida to'liq va tartibli SMS matnini shakllantirish.
 * Saytdagi kabi: Mavzu, Tavsif, Talablar, Sana, Muallif.
 *
 * @param {{ title: string, description?: string, demand?: string, date?: string, author?: string }} param0
 * @returns {string}
 */
export function buildSmsText({ title, description, demand, date, author }) {
  const parts = [];

  parts.push("📢 8-Maktab Yangiligi:");

  if (title && String(title).trim()) {
    parts.push(`📌 Mavzu: ${String(title).trim()}`);
  }

  if (description && String(description).trim()) {
    parts.push(`📝 Tavsif: ${String(description).trim()}`);
  }

  if (demand && String(demand).trim()) {
    parts.push(`⚠️ Talab: ${String(demand).trim()}`);
  }

  if (date && String(date).trim()) {
    parts.push(`📅 Sana: ${String(date).trim()}`);
  }

  if (author && String(author).trim()) {
    parts.push(`✍️ Muallif: ${String(author).trim()}`);
  }

  parts.push("\nBatafsil: 8maktab.uz");

  return parts.join("\n");
}
