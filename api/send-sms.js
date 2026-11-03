// =============================================================================
// api/send-sms.js  —  Vercel Serverless Function
//
// Eskiz.uz SMS API orqali o'qituvchilarga SMS yuboradi.
//
// Qo'ng'iroq yo'li:
//   AdminDashboard (smsMode === "B" yoki "C")
//     → POST /api/send-sms  { title, description, demand, date, author, newsId, phones? }
//       → Eskiz login → token (keshlanadi)
//         → Firestore schools/school_8 → hodimlar[].telefon
//           → raqamlarni tekshirish va dublikatlarni olib tashlash
//             → SMS yuborish (cheklangan parallellik)
//
// Muhit o'zgaruvchilari (.env.local yoki Vercel Dashboard):
//   ESKIZ_EMAIL        — Eskiz.uz hisobiga kirish email
//   ESKIZ_PASSWORD     — Eskiz.uz hisobiga kirish parol
//   ESKIZ_TOKEN        — (ixtiyoriy) tayyor token; bo'lmasa login qilinadi
//   ESKIZ_FROM         — jo'natuvchi nomi (odatda "4546")
//   ESKIZ_BASE_URL     — (ixtiyoriy) https://notify.eskiz.uz/api
//   ESKIZ_FALLBACK_FROM— (ixtiyoriy) asosiy sender rad etilsa ishlatiladigan nom
//   SITE_URL           — (ixtiyoriy) https://8-maktab.vercel.app
//   SMS_MAX_RECIPIENTS — (ixtiyoriy) bir so'rovda maksimal raqam, default 300
//   SMS_CONCURRENCY    — (ixtiyoriy) parallel yuborish soni, default 4
//   SMS_REQUIRE_AUTH   — "true" bo'lsa Firebase ID token talab qilinadi
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//                      — Firestore va auth uchun
//
// MUHIM: hech qanday token/parol kod ichida saqlanmaydi.
// =============================================================================

import admin from "firebase-admin";

const ESKIZ_BASE_URL = (
  process.env.ESKIZ_BASE_URL || "https://notify.eskiz.uz/api"
).replace(/\/+$/, "");

const MAX_RECIPIENTS = Math.max(
  1,
  Math.min(1000, Number(process.env.SMS_MAX_RECIPIENTS || 300) || 300)
);
const CONCURRENCY = Math.min(
  10,
  Math.max(1, Number(process.env.SMS_CONCURRENCY || 4))
);
const REQUIRE_AUTH = process.env.SMS_REQUIRE_AUTH === "true";
const FETCH_TIMEOUT_MS = 15000;
const TOKEN_SAFETY_MS = 5 * 60 * 1000; // token muddati tugashidan 5 daqiqa oldin yangilash

// O'zbekiston mobil operator kodlari (998 dan keyingi 2 raqam)
const UZ_OPERATOR_CODES =
  /^(?:20|33|50|55|6[1-9]|7[0-9]|88|9[0-9])$/;

// ─── Yordamchi funksiyalar ──────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 300) };
  }
}

function maskPhone(phone) {
  if (!phone || phone.length < 6) return "***";
  return `${phone.slice(0, 5)}*****${phone.slice(-2)}`;
}

// ─── Firebase Admin ────────────────────────────────────────────────────────

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

// ─── Eskiz.uz: token olish va keshlash ─────────────────────────────────────

let tokenCache = {
  token: (process.env.ESKIZ_TOKEN || "").trim(),
  expiresAt: 0,
};

let loginInFlight = null;

function getJwtExpiryMs(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded?.exp ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function cacheToken(token) {
  const exp = getJwtExpiryMs(token);
  tokenCache = {
    token,
    expiresAt: exp > 0 ? exp : Date.now() + 20 * 24 * 60 * 60 * 1000,
  };
  return token;
}

async function loginToEskiz() {
  const email = (process.env.ESKIZ_EMAIL || "").trim();
  const password = (process.env.ESKIZ_PASSWORD || "").trim();

  if (!email || !password) {
    throw new Error(
      "Eskiz hisob ma'lumotlari sozlanmagan. Vercel muhit o'zgaruvchilariga " +
        "ESKIZ_EMAIL va ESKIZ_PASSWORD ni kiriting."
    );
  }

  const body = new URLSearchParams();
  body.append("email", email);
  body.append("password", password);

  const response = await fetchWithTimeout(`${ESKIZ_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await readJson(response);

  if (response.ok && json?.data?.token) {
    console.log("[send-sms] Eskiz login muvaffaqiyatli.");
    return cacheToken(String(json.data.token));
  }

  const reason =
    json?.message || json?.error || `HTTP ${response.status}`;
  throw new Error(`Eskiz login xatosi: ${reason}`);
}

/**
 * Amaldagi tokenni qaytaradi. Token muddati yaqinlashsa yoki forceRefresh
 * berilsa, yangi token oladi. Bir vaqtda faqat bitta login so'rovi ketadi.
 */
async function getEskizToken(forceRefresh = false) {
  const now = Date.now();

  if (
    !forceRefresh &&
    tokenCache.token &&
    tokenCache.expiresAt - TOKEN_SAFETY_MS > now
  ) {
    return tokenCache.token;
  }

  if (loginInFlight) {
    return loginInFlight;
  }

  loginInFlight = loginToEskiz();

  try {
    return await loginInFlight;
  } finally {
    loginInFlight = null;
  }
}

// ─── Telefon raqamini tozalash va tekshirish (O'zbekiston) ──────────────────

/**
 * Telefon raqamini 998XXXXXXXXX ko'rinishiga keltiradi.
 * Qo'llab-quvvatlanadi: +998 90 123 45 67, 998901234567, 89012345678,
 * 0901234567, 901234567, 00998901234567.
 *
 * @param {string} phone
 * @returns {string|null} 12 xonali raqam yoki null
 */
function normalizeUzPhone(phone) {
  if (phone === null || phone === undefined) return null;

  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  // Xalqaro "00" prefiksi
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // 8 998 90 123 45 67 (13 xona)
  if (digits.length === 13 && digits.startsWith("8")) {
    digits = digits.slice(1);
  }

  // 0 90 123 45 67 (10 xona)
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = "998" + digits.slice(1);
  }

  // 90 123 45 67 (9 xona)
  if (digits.length === 9) {
    digits = "998" + digits;
  }

  if (digits.length !== 12 || !digits.startsWith("998")) {
    return null;
  }

  const operator = digits.slice(3, 5);
  if (!UZ_OPERATOR_CODES.test(operator)) {
    return null;
  }

  return digits;
}

// ─── SMS matni (GSM-7, emoji va maxsus belgilarsiz) ─────────────────────────

/**
 * Emoji va GSM-7 qo'llab-quvvatlamaydigan belgilarni almashtiradi.
 * Emoji ishlatilsa SMS UCS-2 ga o'tadi va narx 2 baravar oshadi.
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
 * Yangilik ma'lumotlaridan qisqa va tushunarli SMS matnini yasaydi.
 * Matn 300 belgidan oshmaydi (2 ta SMS segmenti).
 */
function buildSmsText({ title, description, demand, date, author }) {
  const site = (process.env.SITE_URL || "https://8-maktab.vercel.app")
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

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

  let text = lines.join("\n").trim();

  if (text.length > 300) {
    text = text.slice(0, 297).trimEnd() + "...";
  }

  return text;
}

// ─── Eskiz.uz: bitta SMS yuborish ──────────────────────────────────────────

async function sendOneSms(token, phone, message, from) {
  const body = new URLSearchParams();
  body.append("mobile_phone", phone);
  body.append("message", message);
  body.append("from", from);

  try {
    const response = await fetchWithTimeout(
      `${ESKIZ_BASE_URL}/message/sms/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    const json = await readJson(response);
    const rawMessage =
      json?.message || json?.error || json?.data?.message || `HTTP ${response.status}`;
    const lowerMessage = String(rawMessage).toLowerCase();

    const isError =
      !response.ok ||
      json?.status === "error" ||
      json?.status === "fail" ||
      Boolean(json?.error);

    if (!isError) {
      return {
        ok: true,
        phone,
        messageId: json?.id || json?.data?.id || null,
        response: json,
      };
    }

    let code = "SEND_FAILED";

    if (response.status === 401 || /token|unauthor|авториз/.test(lowerMessage)) {
      code = "AUTH";
    } else if (/теста|test rejim|test mode/.test(lowerMessage)) {
      code = "TEST_MODE";
    } else if (/from|nick|sender|отправител/.test(lowerMessage)) {
      code = "INVALID_SENDER";
    } else if (/balance|баланс|money|средств|to'lov/.test(lowerMessage)) {
      code = "NO_BALANCE";
    } else if (response.status === 429 || /limit|too many|часто/.test(lowerMessage)) {
      code = "RATE_LIMIT";
    }

    return {
      ok: false,
      phone,
      code,
      error: String(rawMessage),
      response: json,
    };
  } catch (fetchErr) {
    return {
      ok: false,
      phone,
      code: fetchErr.name === "AbortError" ? "TIMEOUT" : "NETWORK",
      error:
        fetchErr.name === "AbortError"
          ? "Eskiz API javob bermadi (timeout)."
          : fetchErr.message,
    };
  }
}

/**
 * Bitta raqamga SMS yuboradi; token eskirgan bo'lsa qayta login qilib,
 * sender rad etilsa zaxira sender bilan bir marta qayta urinadi.
 */
async function sendSmsWithRetry(phone, message, from) {
  let token = await getEskizToken();
  let result = await sendOneSms(token, phone, message, from);

  if (!result.ok && result.code === "AUTH") {
    token = await getEskizToken(true);
    result = await sendOneSms(token, phone, message, from);
  }

  const fallbackFrom = (process.env.ESKIZ_FALLBACK_FROM || "4546").trim();
  if (
    !result.ok &&
    result.code === "INVALID_SENDER" &&
    fallbackFrom &&
    fallbackFrom !== from
  ) {
    result = await sendOneSms(token, phone, message, fallbackFrom);
  }

  if (!result.ok && result.code === "RATE_LIMIT") {
    await sleep(1200);
    result = await sendOneSms(token, phone, message, from);
  }

  return result;
}

// ─── Cheklangan parallellik bilan ishlash ───────────────────────────────────

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => run()
  );

  await Promise.all(workers);
  return results;
}

// ─── So'rovlarni cheklash (oddiy in-memory rate limit) ─────────────────────

const rateBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

// ─── Ixtiyoriy admin autentifikatsiyasi ────────────────────────────────────

async function verifyAdmin(req) {
  if (!REQUIRE_AUTH) return { ok: true };

  const header = req.headers.authorization || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!idToken) {
    return { ok: false, error: "Avtorizatsiya tokeni topilmadi." };
  }

  const fbAdmin = getFirebaseAdmin();
  if (!fbAdmin.apps.length) {
    return {
      ok: false,
      error: "Serverda Firebase Admin sozlanmagan, autentifikatsiyani tekshirib bo'lmaydi.",
    };
  }

  try {
    await fbAdmin.auth().verifyIdToken(idToken);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: "Avtorizatsiya tokeni yaroqsiz: " + error.message };
  }
}

// ─── Asosiy handler ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Faqat POST so'rovlar qabul qilinadi." });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: "Juda ko'p so'rov yuborildi. Bir daqiqadan so'ng qayta urinib ko'ring.",
    });
  }

  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return res.status(401).json({ error: auth.error });
  }

  // ── 1. So'rov tanasini tekshirish ─────────────────────────────────────────
  const {
    title,
    description,
    demand,
    date,
    author,
    newsId,
  } = req.body || {};

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "Yangilik sarlavhasi (title) kiritilishi shart." });
  }

  // ── 2. Telefon raqamlarini aniqlash ───────────────────────────────────────
  let phones = [];
  const bodyPhones = Array.isArray(req.body?.phones)
    ? req.body.phones.filter(Boolean)
    : null;

  if (bodyPhones && bodyPhones.length > 0) {
    phones = bodyPhones;
    console.log(
      `[send-sms] So'rov tanasidan ${phones.length} ta telefon raqam qabul qilindi.`
    );
  } else {
    // So'rovda raqam bo'lmasa, Firestore dan olamiz
    try {
      const fbAdmin = getFirebaseAdmin();

      if (fbAdmin.apps.length) {
        const db = fbAdmin.firestore();
        const schoolSnap = await db.collection("schools").doc("school_8").get();

        if (schoolSnap.exists) {
          const schoolData = schoolSnap.data();
          const hodimlar = Array.isArray(schoolData?.hodimlar)
            ? schoolData.hodimlar
            : [];

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
        } else {
          console.warn("[send-sms] schools/school_8 hujjati topilmadi.");
        }
      }
    } catch (dbErr) {
      console.error("[send-sms] Firestore xatosi:", dbErr.message);
    }
  }

  // ── 3. Tozalash, tekshirish, dublikatlarni olib tashlash ──────────────────
  const normalized = phones.map(normalizeUzPhone);
  const invalidPhones = phones.filter((_, i) => !normalized[i]);
  const validPhones = [
    ...new Set(normalized.filter(Boolean)),
  ].slice(0, MAX_RECIPIENTS);

  if (validPhones.length === 0) {
    return res.status(200).json({
      success: false,
      sentTo: 0,
      failed: 0,
      invalidCount: invalidPhones.length,
      errors: [],
      message:
        phones.length === 0
          ? "Hech bir xodimda telefon raqam topilmadi. Xodimlar bo'limida raqamlarni kiriting."
          : "Telefon raqamlarning barchasi noto'g'ri. Namuna: +998901234567. Eskiz hisobidan mablag' sarflanmadi.",
    });
  }

  // ── 4. Token va SMS matni ─────────────────────────────────────────────────
  try {
    await getEskizToken();
  } catch (tokenErr) {
    console.error("[send-sms] Eskiz token xatosi:", tokenErr.message);
    return res.status(500).json({
      error: "Eskiz.uz ga ulanib bo'lmadi: " + tokenErr.message,
    });
  }

  const smsText = buildSmsText({ title, description, demand, date, author });
  const smsFrom = (process.env.ESKIZ_FROM || "4546").trim();

  console.log(
    `[send-sms] Yuborilmoqda: newsId=${newsId || "yangi"}, ` +
      `yaroqli=${validPhones.length}, yaroqsiz=${invalidPhones.length}, ` +
      `from="${smsFrom}", matn_uzunligi=${smsText.length}`
  );

  // ── 5. SMS yuborish ───────────────────────────────────────────────────────
  const results = await mapWithConcurrency(
    validPhones,
    CONCURRENCY,
    async (phone, index) => {
      // Eskiz API ni haddan ortiq yuklamaslik uchun kichik pauza
      if (index > 0) await sleep(90);
      try {
        return await sendSmsWithRetry(phone, smsText, smsFrom);
      } catch (error) {
        return {
          ok: false,
          phone,
          code: "NETWORK",
          error: error.message || "SMS yuborishda noma'lum xatolik.",
        };
      }
    }
  );

  let sentTo = 0;
  let failed = 0;
  const errors = [];
  const errorCodeCounts = {};

  for (const result of results) {
    if (result.ok) {
      sentTo += 1;
    } else {
      failed += 1;
      errorCodeCounts[result.code] = (errorCodeCounts[result.code] || 0) + 1;
      errors.push(`${maskPhone(result.phone)}: ${result.error}`);
      console.warn(
        `[send-sms] Xato ${maskPhone(result.phone)} (${result.code}): ${result.error}`
      );
    }
  }

  console.log(
    `[send-sms] Natija: ${sentTo} muvaffaqiyatli, ${failed} xato, ${invalidPhones.length} yaroqsiz raqam.`
  );

  let message;

  if (sentTo > 0) {
    message =
      `${sentTo} ta raqamga SMS muvaffaqiyatli yuborildi.` +
      (failed > 0 ? ` ${failed} ta raqamga bormadi.` : "") +
      (invalidPhones.length > 0
        ? ` ${invalidPhones.length} ta raqam formati xato.`
        : "");
  } else if (errorCodeCounts.TEST_MODE) {
    message =
      "Eskiz akkaunti test rejimida. Haqiqiy SMS yuborish uchun Eskiz kabinetida " +
      "hisobni tasdiqlang va balansni to'ldiring.";
  } else if (errorCodeCounts.NO_BALANCE) {
    message = "Eskiz hisobidagi balans tugagan. Iltimos, balansni to'ldiring.";
  } else if (errorCodeCounts.INVALID_SENDER) {
    message =
      "Eskiz da jo'natuvchi nomi (ESKIZ_FROM) tasdiqlanmagan. " +
      "4546 nomidan foydalaning yoki Eskiz kabinetida nomni tasdiqlang.";
  } else if (errorCodeCounts.AUTH) {
    message = "Eskiz avtorizatsiyasida xatolik. ESKIZ_EMAIL/ESKIZ_PASSWORD ni tekshiring.";
  } else {
    message = `Hech bir raqamga SMS yuborib bo'lmadi. Xatolar: ${errors
      .slice(0, 5)
      .join("; ")}`;
  }

  return res.status(200).json({
    success: sentTo > 0,
    sentTo,
    failed,
    totalRequested: phones.length,
    validCount: validPhones.length,
    invalidCount: invalidPhones.length,
    errors: errors.slice(0, 10),
    errorCodeCounts,
    message,
  });
}
