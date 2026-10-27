// =============================================================================
// api/send-sms.js  —  Vercel Serverless Function
//
// Eskiz.uz SMS API orqali barcha o'qituvchilarga SMS yuboradi.
//
// Qo'ng'iroq yo'li:
//   AdminDashboard (yangilik qo'shilganda smsMode === "B" yoki "C")
//     → POST /api/send-sms  { title, description, newsId? }
//       → Eskiz login → token olish
//         → Firestore schools/school_8 → hodimlar[].telefon raqamlarini olish
//           → Har bir raqamga SMS yuborish
//             → { success, sentTo, failed, errors }
//
// Muhit o'zgaruvchilari (.env.local yoki Vercel Dashboard):
//   ESKIZ_EMAIL        — Eskiz.uz hisobiga kirish email
//   ESKIZ_PASSWORD     — Eskiz.uz hisobiga kirish parol
//   ESKIZ_FROM         — SMS jo'natuvchi nomi (Eskiz da ro'yxatdan o'tgan, odatda "4546")
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//                      — Firebase Admin uchun (Firestore dan raqam olish uchun)
//
// =============================================================================

import admin from "firebase-admin";

// ─── Firebase Admin (Firestore ga kirish uchun) ─────────────────────────────

function getFirebaseAdmin() {
  if (admin.apps.length) {
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
  }

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } catch (initErr) {
      // Agar avval initializeApp chaqirilgan bo'lsa, bu xatolikni e'tiborsiz qoldiramiz
      console.error("Firebase Admin initialize xatosi:", initErr.message);
    }
  } else {
    console.warn(
      "Firebase Admin o'zgaruvchilari yetishmayapti: " +
        "FIREBASE_PROJECT_ID=" + Boolean(projectId) +
        ", FIREBASE_CLIENT_EMAIL=" + Boolean(clientEmail) +
        ", FIREBASE_PRIVATE_KEY=" + Boolean(privateKey)
    );
  }

  return admin;
}

// ─── Eskiz.uz: Bearer token olish ───────────────────────────────────────────

/**
 * Eskiz.uz API ga login bo'lib Bearer token qaytaradi.
 * Token taxminan 30 kun amal qiladi.
 *
 * @returns {Promise<string>} Bearer token
 */
async function getEskizToken() {
  // 1. Agar .env da yoki zaxirada tayyor ESKIZ_TOKEN bo'lsa, to'g'ridan-to'g'ri shuni qaytaramiz
  const token =
    process.env.ESKIZ_TOKEN ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTU1MDgwOTYsImlhdCI6MTc5MjkxNjA5Niwicm9sZSI6InRlc3QiLCJzaWduIjoiYTM5YmJhNjk1YTBiNGI5MGYwNWM5NGEwNjQ3Mzk3NDdiYTQxOTkyMjUzNmUxMmRjMmQzM2YyYzc0M2ViMmYwNyIsInN1YiI6IjE4MzkzIn0.BOn_-2dIrI0YffVPnzLWO-XwY_SArAUhx_Uz-GR55Rk";

  if (token && token.trim()) {
    console.log("[send-sms] Tayyor ESKIZ_TOKEN ishlatilmoqda.");
    return token.trim();
  }

  const envEmail = process.env.ESKIZ_EMAIL;
  const envPass = process.env.ESKIZ_PASSWORD;

  // Eskiz ba'zan telefon raqam yoki kichik harfdagi parolni qabul qiladi
  const attempts = [
    // 1. .env dan yoki asosiy email va parol
    { email: envEmail || "sakkizinchimaktab888@gmail.com", password: envPass || "Maktab888" },
    // 2. Kichik harfdagi parol
    { email: envEmail || "sakkizinchimaktab888@gmail.com", password: (envPass || "Maktab888").toLowerCase() },
    // 3. Telefon raqam (998999770917)
    { email: "998999770917", password: envPass || "Maktab888" },
    { email: "998999770917", password: (envPass || "Maktab888").toLowerCase() },
    // 4. Qisqa telefon raqam (999770917)
    { email: "999770917", password: envPass || "Maktab888" },
    { email: "999770917", password: (envPass || "Maktab888").toLowerCase() },
  ];

  let lastError = null;

  for (const { email, password } of attempts) {
    try {
      const body = new URLSearchParams();
      body.append("email", email);
      body.append("password", password);

      const response = await fetch("https://notify.eskiz.uz/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const json = await response.json();

      if (response.ok && json?.data?.token) {
        console.log(`[send-sms] Eskiz login muvaffaqiyatli: login="${email}"`);
        return json.data.token;
      }

      lastError = json?.message || json?.error || `HTTP ${response.status}`;
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(
    "Eskiz login xatosi: " + lastError
  );
}

// ─── Telefon raqamini tozalash va tekshirish (O'zbekiston) ──────────────────

/**
 * Telefon raqamini tekshirib, to'g'ri formatga keltiradi (998XXXXXXXXX).
 * Noto'g'ri, chala yoki bo'sh raqamlarga SMS ketmaydi va pul sarflanmaydi.
 *
 * @param {string} phone
 * @returns {string|null} 12 xonali to'g'ri raqam yoki null
 */
function normalizeUzPhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");

  // 9 xonali bo'lsa: "901234567" -> "998901234567"
  if (digits.length === 9) {
    return "998" + digits;
  }

  // 12 xonali va 998 bilan boshlansa: "998901234567"
  if (digits.length === 12 && digits.startsWith("998")) {
    return digits;
  }

  return null; // Yaroqsiz yoki xato raqam
}

// ─── Eskiz.uz: Bitta SMS yuborish ───────────────────────────────────────────

/**
 * Eskiz.uz orqali bitta raqamga SMS yuboradi.
 *
 * @param {string} token   Bearer token (getEskizToken dan olingan)
 * @param {string} phone   Tozalangan 12 xonali raqam (998XXXXXXXXX)
 * @param {string} message SMS matni
 * @param {string} from    Jo'natuvchi nomi (Eskiz da ro'yxatdan o'tgan)
 * @returns {Promise<{ok: boolean, phone: string, response?: object, error?: string}>}
 */
async function sendOneSms(token, phone, message, from) {
  let chosenFrom = from || process.env.ESKIZ_FROM || "8-Maktab";

  const body = new URLSearchParams();
  body.append("mobile_phone", phone);
  body.append("message", message);
  body.append("from", chosenFrom);

  try {
    let res = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    let json = await res.json();

    // 1. Agar jo'natuvchi nomi (8-Maktab) hali tasdiqlanmagan bo'lsa, avtomatik 4546 bilan qayta urinish:
    if (!res.ok || json?.status === "error") {
      const errMsg = (json?.message || "").toLowerCase();
      if (
        chosenFrom !== "4546" &&
        (errMsg.includes("from") ||
          errMsg.includes("nick") ||
          errMsg.includes("sender") ||
          errMsg.includes("отправител") ||
          errMsg.includes("status: 400"))
      ) {
        console.warn(`[send-sms] "${chosenFrom}" nomi rad etildi, 4546 orqali qayta yuborilmoqda...`);
        const fallbackBody = new URLSearchParams();
        fallbackBody.append("mobile_phone", phone);
        fallbackBody.append("message", message);
        fallbackBody.append("from", "4546");

        const fallbackRes = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: fallbackBody,
        });

        const fallbackJson = await fallbackRes.json();
        if (fallbackRes.ok && fallbackJson?.status !== "error") {
          return { ok: true, phone, response: fallbackJson };
        }
        json = fallbackJson;
        res = fallbackRes;
      }
    }

    // 2. Agar akkaunt test rejimida bo'lsa va Eskiz faqat test matnini talab qilsa:
    if (!res.ok || json?.status === "error") {
      const errMsg = json?.message || "";
      if (errMsg.includes("Для теста можно использовать")) {
        const retryBody = new URLSearchParams();
        retryBody.append("mobile_phone", phone);
        retryBody.append("message", "Bu Eskiz dan test");
        retryBody.append("from", "4546");

        const retryRes = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: retryBody,
        });

        const retryJson = await retryRes.json();
        if (retryRes.ok && retryJson?.status !== "error") {
          return {
            ok: true,
            phone,
            response: retryJson,
            isTestMode: true,
          };
        }
      }

      return {
        ok: false,
        phone,
        error: json?.message || `HTTP ${res.status}`,
        response: json,
      };
    }

    return { ok: true, phone, response: json };
  } catch (fetchErr) {
    return { ok: false, phone, error: fetchErr.message };
  }
}

// ─── SMS matni yaratish ─────────────────────────────────────────────────────

/**
 * Yangilik ma'lumotlari asosida to'liq va tartibli SMS matnini shakllantirish:
 * Mavzu, Tavsif, Talablar, Sana, Muallif.
 *
 * @param {{ title: string, description?: string, demand?: string, date?: string, author?: string }} param0
 * @returns {string}
 */
function buildSmsText({ title, description, demand, date, author }) {
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

// ─── Asosiy handler ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS sarlavhalari
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Faqat POST so'rovlar qabul qilinadi." });
  }

  // ── 1. So'rov tanasini tekshirish ─────────────────────────────────────────
  const { title, description, demand, date, author, newsId } = req.body || {};

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "Yangilik sarlavhasi (title) kiritilishi shart." });
  }

  // ── 2. Eskiz token olish ───────────────────────────────────────────────────
  let eskizToken;
  try {
    eskizToken = await getEskizToken();
  } catch (tokenErr) {
    console.error("[send-sms] Eskiz token xatosi:", tokenErr.message);
    return res.status(500).json({
      error: "Eskiz.uz ga ulanib bo'lmadi: " + tokenErr.message,
    });
  }

  // ── 3. O'qituvchilar telefon raqamlarini aniqlash ────────────────────────
  let phones = [];

  // A) Agar so'rov tanasida (body) telefon raqamlari uzatilgan bo'lsa:
  if (Array.isArray(req.body?.phones) && req.body.phones.length > 0) {
    phones = req.body.phones.filter(Boolean);
    console.log(`[send-sms] So'rov tanasidan ${phones.length} ta telefon raqam qabul qilindi.`);
  }

  // B) Agar body da raqamlar bo'lmasa, Firestore (Firebase Admin) orqali olishga urinamiz:
  if (phones.length === 0) {
    try {
      const fbAdmin = getFirebaseAdmin();

      if (fbAdmin.apps.length) {
        const db = fbAdmin.firestore();
        const schoolSnap = await db.collection("schools").doc("school_8").get();

        if (schoolSnap.exists) {
          const schoolData = schoolSnap.data();
          const hodimlar = Array.isArray(schoolData?.hodimlar) ? schoolData.hodimlar : [];

          // Har bir hodimdan telefon maydonini olish
          // Qo'llab-quvvatlanadigan maydon nomlari: telefon | phone | tel | raqam | mob
          phones = hodimlar
            .map(
              (h) =>
                h.telefon ||
                h.phone ||
                h.tel ||
                h.raqam ||
                h.mob ||
                null
            )
            .filter(Boolean);

          console.log(
            `[send-sms] Firestore dan ${hodimlar.length} xodimdan ${phones.length} ta telefon raqam topildi.`
          );
        }
      }
    } catch (dbErr) {
      console.error("[send-sms] Firestore xatosi:", dbErr.message);
    }
  }

  // ── 4. Raqamlarni tozalash, tekshirish va dublikatlarni olib tashlash ───
  // - Bo'sh yoki raqam kiritilmagan o'qituvchilar chetlatiladi (ularga SMS ketmaydi)
  // - Xato formatdagi raqamlar chetlatiladi (Eskiz ga xato so'rov jo'natilmaydi)
  // - Bir xil raqam qayta-qayta uchrasa, faqat 1 marta yuboriladi (Set orqali)
  const validPhones = [...new Set(phones.map(normalizeUzPhone).filter(Boolean))];

  if (validPhones.length === 0) {
    return res.status(200).json({
      success: false,
      sentTo: 0,
      failed: 0,
      errors: [],
      message:
        "Hech bir xodimda to'g'ri telefon raqam topilmadi. " +
        "Eskiz hisobingizdan mablag' sarflanmadi. " +
        "Iltimos, Xodimlar bo'limida o'qituvchilarning telefon raqamlarini to'liq kiriting (masalan: +998901234567).",
    });
  }

  // ── 5. SMS matni ───────────────────────────────────────────────────────────
  const smsText = buildSmsText({
    title: String(title),
    description: String(description || ""),
    demand: String(demand || ""),
    date: String(date || ""),
    author: String(author || ""),
  });
  const smsFrom = process.env.ESKIZ_FROM || "8-Maktab";

  console.log(
    `[send-sms] SMS yuborilmoqda: newsId=${newsId || "yangi"}, ` +
      `jami_olingan=${phones.length}, yaroqli_va_takrorlanmas=${validPhones.length}, from="${smsFrom}"`,
    `\nMatn: ${smsText}`
  );

  // ── 6. Har bir to'g'ri raqamga SMS yuborish (ketma-ket, 150ms oraliq) ───────
  const results = [];
  let sentTo = 0;
  let failed = 0;
  const errors = [];

  for (const phone of validPhones) {
    const result = await sendOneSms(eskizToken, phone, smsText, smsFrom);
    results.push(result);

    if (result.ok) {
      sentTo++;
    } else {
      failed++;
      errors.push(`${result.phone || phone}: ${result.error}`);
      console.warn(`[send-sms] ❌ ${result.phone || phone}: ${result.error}`);
    }

    // Eskiz API ni haddan ortiq yuklamaslik uchun qisqa pauza
    if (phones.length > 1) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  console.log(`[send-sms] Natija: ${sentTo} muvaffaqiyatli, ${failed} xato.`);

  const hasTestMode = results.some((r) => r.isTestMode);

  return res.status(200).json({
    success: sentTo > 0,
    sentTo,
    failed,
    errors,
    message:
      sentTo > 0
        ? `✅ ${sentTo} ta raqamga SMS muvaffaqiyatli yuborildi!` +
          (hasTestMode
            ? " (Akkauntingiz test rejimida bo'lgani sababli Eskiz test xabari yuborildi. Real yangilik matni borishi uchun Eskiz hisobingiz balansini to'ldiring)."
            : "") +
          (failed > 0 ? ` (${failed} ta raqamga bormadi)` : "")
        : `⚠️ Hech bir raqamga SMS yuborib bo'lmadi. Xatolar: ${errors.join("; ")}`,
  });
}
