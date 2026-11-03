import admin from "firebase-admin";

// Firebase Cloud Messaging bir so'rovda ko'pi bilan 500 ta tokenni qabul qiladi.
const MAX_TOKENS_PER_BATCH = 500;
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 400;

// Ixtiyoriy: "true" bo'lsa faqat tizimga kirgan admin push yubora oladi.
const REQUIRE_AUTH = process.env.PUSH_REQUIRE_AUTH === "true";

// Serverless muhitda admin ilovasini faqat bir marta initialize qilish
function getFirebaseAdmin() {
  if (admin.apps.length) {
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Agar privateKey tirnoq ichida bo'lsa yoki \n lar to'g'rilanishi kerak bo'lsa
    privateKey = privateKey.replace(/\\n/g, "\n");
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
  }

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin muvaffaqiyatli ishga tushdi.");
    } catch (initErr) {
      console.error("Firebase Admin initialize xatosi:", initErr);
    }
  } else {
    console.warn(
      "Firebase Admin o'zgaruvchilari yetishmayapti: projectId=" +
        Boolean(projectId) +
        ", clientEmail=" +
        Boolean(clientEmail) +
        ", privateKey=" +
        Boolean(privateKey)
    );
  }

  return admin;
}

function clampText(value, maxLength) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, Math.max(0, maxLength - 1)).trimEnd() + "…";
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

// Oddiy in-memory rate limit (spam dan himoya)
const rateBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 8;

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
  } catch {
    return { ok: false, error: "Avtorizatsiya tokeni yaroqsiz." };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Faqat POST so'rovlarni qabul qilish
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

  const fbAdmin = getFirebaseAdmin();
  if (!fbAdmin.apps.length) {
    return res.status(500).json({
      error:
        "Firebase Admin ishga tushmadi. Vercel muhit o'zgaruvchilarini tekshiring (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).",
    });
  }

  try {
    const { title, body, url, newsId, image } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Sarlavha (title) kiritilishi shart." });
    }

    const db = fbAdmin.firestore();
    const tokensSnapshot = await db.collection("fcm_tokens").get();

    if (tokensSnapshot.empty) {
      return res.status(200).json({
        success: true,
        sentCount: 0,
        successCount: 0,
        failureCount: 0,
        message: "Hech qanday obunachi topilmadi (fcm_tokens bo'sh).",
      });
    }

    // Har bir tokenni faqat bir marta yuborish uchun Map ishlatamiz
    const tokenDocMap = new Map();
    tokensSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data?.enabled === false) return;

      const token = data?.token;
      if (typeof token === "string" && token.length > 20) {
        tokenDocMap.set(token, docSnap.ref);
      }
    });

    const tokens = Array.from(tokenDocMap.keys());
    if (tokens.length === 0) {
      return res.status(200).json({
        success: true,
        sentCount: 0,
        successCount: 0,
        failureCount: 0,
        message: "Yaroqli tokenlar topilmadi.",
      });
    }

    const notificationTitle = clampText(title, MAX_TITLE_LENGTH);
    const notificationBody = clampText(body, MAX_BODY_LENGTH);

    // FCM `fcmOptions.link` mutlaq (absolute) URL talab qiladi
    const siteOrigin = (
      process.env.SITE_URL ||
      req.headers.origin ||
      "https://8-maktab.vercel.app"
    ).replace(/\/+$/, "");

    const rawUrl =
      typeof url === "string" && url.trim() ? url.trim() : "/news";

    const absoluteTargetUrl = /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `${siteOrigin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

    // Service worker nisbiy manzilni o'zi to'g'rilaydi
    const relativeUrl = /^https?:\/\//i.test(rawUrl)
      ? new URL(rawUrl).pathname
      : rawUrl;

    const tag = newsId ? `news-${newsId}` : `news-${Date.now()}`;

    const messagePayload = {
      data: {
        title: notificationTitle,
        body: notificationBody,
        url: relativeUrl,
        icon: "/icons/icon-192.png",
        tag,
        ...(newsId ? { newsId: String(newsId) } : {}),
        ...(image ? { image: String(image) } : {}),
      },
      webpush: {
        headers: {
          Urgency: "high",
          TTL: "86400", // 24 soat kutiladi
        },
        fcmOptions: {
          link: absoluteTargetUrl,
        },
      },
      android: {
        priority: "high",
      },
    };

    let successCount = 0;
    let failureCount = 0;
    const staleRefs = new Set();
    const sampleErrors = [];

    // 500 tadan ortiq obunachi bo'lsa ham hammasiga yuboriladi
    for (let index = 0; index < tokens.length; index += MAX_TOKENS_PER_BATCH) {
      const batch = tokens.slice(index, index + MAX_TOKENS_PER_BATCH);

      const response = await fbAdmin
        .messaging()
        .sendEachForMulticast({ ...messagePayload, tokens: batch });

      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (resp.success || !resp.error) return;

        const errorCode = resp.error.code;

        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          const docRef = tokenDocMap.get(batch[idx]);
          if (docRef) staleRefs.add(docRef);
        } else if (sampleErrors.length < 5) {
          sampleErrors.push(resp.error.message);
        }
      });
    }

    // Yaroqsiz yoki eskirgan tokenlarni Firestore'dan tozalash
    if (staleRefs.size > 0) {
      await Promise.allSettled(Array.from(staleRefs, (ref) => ref.delete()));
    }

    return res.status(200).json({
      success: successCount > 0,
      totalTokens: tokens.length,
      sentCount: successCount,
      successCount,
      failureCount,
      cleanedTokensCount: staleRefs.size,
      errors: sampleErrors,
      message:
        successCount > 0
          ? `${successCount}/${tokens.length} ta qurilmaga push yuborildi.` +
            (failureCount > 0 ? ` ${failureCount} ta qurilmaga yetib bormadi.` : "")
          : "Hech bir qurilmaga push yuborib bo'lmadi.",
    });
  } catch (error) {
    console.error("send-push xatosi:", error);
    return res.status(500).json({
      error: error.message || "Push bildirishnoma yuborishda xatolik yuz berdi.",
    });
  }
}
