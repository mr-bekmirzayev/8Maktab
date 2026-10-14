// =============================================================================
// eskizSmsService.js
// Eskiz.uz SMS API bilan ishlash uchun yordamchi modul.
//
// ⚠️  MUHIM XAVFSIZLIK ESLATMASI:
//     Eskiz tokeni frontend kodida OCHIQ saqlansa, har kim uni o'g'irlab
//     hisobingizdan SMS yubora oladi!
//     Shuning uchun bu modul ikkita rejimda ishlaydi:
//
//     TAVSIYA ETILGAN  →  Firebase Cloud Function (backend) orqali yuborish.
//                         Token faqat serverda saqlanadi.
//                         src/utils/eskizSmsService.js da faqat HTTP so'rovi
//                         bo'lib, token ko'rinmaydi.
//
//     TEZKOR TEST UCHUN → To'g'ridan-to'g'ri Eskiz API ga murojaat qilish.
//                         Faqat lokal test / prototip uchun foydaling.
//                         Production da ishlatmang!
// =============================================================================

// ─── 1. SOZLAMALAR ────────────────────────────────────────────────────────────

/**
 * Firebase Cloud Function URL.
 * "firebase deploy --only functions" dan keyin bu URL avtomatik tayyor bo'ladi.
 * Agar Cloud Function ishlatmasangiz, null qoldiring va
 * ESKIZ_TOKEN ni to'ldiring (faqat test uchun).
 */
const CLOUD_FUNCTION_URL =
  "https://us-central1-schoolnews-cd298.cloudfunctions.net/sendNewsSms";

/**
 * FAQAT TO'G'RIDAN-TO'G'RI TEST UCHUN.
 * Production da bu yerga token yozmang.
 * Bu o'rniga Cloud Function ishlating.
 */
const ESKIZ_TOKEN = ""; // ← Faqat test uchun to'ldiring, prod da bo'sh qoldiring

/** Eskiz.uz SMS API bazaviy manzili */
const ESKIZ_BASE_URL = "https://notify.eskiz.uz/api";

/** SMS yuborayotgan nomi (Eskiz.uz da ro'yxatdan o'tkarilgan bo'lishi kerak) */
const SMS_FROM = "4546";

// ─── 2. ASOSIY FUNKSIYA (Cloud Function orqali) ───────────────────────────────

/**
 * Yangilik haqida barcha o'qituvchilarga SMS yuboradi.
 * Firebase Cloud Function "sendNewsSms" ga POST so'rovi jo'natadi.
 *
 * @param {{ title: string, description?: string, newsId?: string }} newsData
 * @returns {Promise<{ success: boolean, sentTo?: number, error?: string }>}
 */
export async function sendNewsSmsThroughCloudFunction(newsData) {
  if (!CLOUD_FUNCTION_URL) {
    throw new Error(
      "CLOUD_FUNCTION_URL bo'sh. Firebase Cloud Function deploy qilinganmi?"
    );
  }

  const response = await fetch(CLOUD_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newsId: newsData.newsId || null,
      title: newsData.title,
      description: newsData.description || "",
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json?.error || `Server xatosi: ${response.status}`
    );
  }

  return json; // { success: true, sentTo: 45 }
}

// ─── 3. TO'G'RIDAN-TO'G'RI ESKIZ API (faqat test uchun) ──────────────────────

/**
 * Bitta raqamga SMS yuboradi (to'g'ridan-to'g'ri Eskiz API).
 * Faqat lokal test uchun. Tokenni frontend da saqlash xavfli!
 *
 * @param {string} phone   "+998XXXXXXXXX" formatida
 * @param {string} message SMS matni
 * @returns {Promise<object>} Eskiz API javobi
 */
export async function sendSingleSms(phone, message) {
  if (!ESKIZ_TOKEN) {
    throw new Error(
      "ESKIZ_TOKEN bo'sh. Cloud Function ishlating yoki tokenni vaqtincha to'ldiring."
    );
  }

  const body = new URLSearchParams();
  body.append("mobile_phone", phone.replace(/\D/g, "")); // faqat raqamlar
  body.append("message", message);
  body.append("from", SMS_FROM);

  const response = await fetch(`${ESKIZ_BASE_URL}/message/sms/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ESKIZ_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = await response.json();
  if (!response.ok || json?.status === "error") {
    throw new Error(json?.message || "SMS yuborishda xatolik");
  }
  return json;
}

/**
 * Bir nechta raqamlarga SMS yuboradi (to'g'ridan-to'g'ri Eskiz API).
 * Faqat lokal test uchun.
 *
 * @param {string[]} phones   Raqamlar massivi ["+998901234567", ...]
 * @param {string}   message  SMS matni
 * @returns {Promise<{ success: number, failed: number, errors: string[] }>}
 */
export async function sendBulkSmsDirect(phones, message) {
  let success = 0;
  let failed = 0;
  const errors = [];

  for (const phone of phones) {
    try {
      await sendSingleSms(phone, message);
      success++;
    } catch (err) {
      failed++;
      errors.push(`${phone}: ${err.message}`);
    }
  }

  return { success, failed, errors };
}

// ─── 4. SMS MATN SHABLONI ─────────────────────────────────────────────────────

/**
 * Yangilik asosida SMS matnini tayyorlab beradi.
 * Eskiz.uz 160 belgidan uzun SMS uchun qo'shimcha haq oladi.
 *
 * @param {{ title: string, description?: string }} news
 * @returns {string} SMS matni
 */
export function buildSmsText({ title, description }) {
  const base = `📢 8-Maktab yangiligi:\n${title}`;
  if (description) {
    const shortDesc =
      description.length > 80
        ? description.slice(0, 80) + "..."
        : description;
    return `${base}\n${shortDesc}\n\n8maktab.uz`;
  }
  return `${base}\n\n8maktab.uz`;
}
