import admin from "firebase-admin";

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

export default async function handler(req, res) {
  // CORS sarlavhalari (zarur bo'lsa)
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Faqat POST so'rovlarni qabul qilish
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Faqat POST so'rovlar qabul qilinadi." });
  }

  const fbAdmin = getFirebaseAdmin();
  if (!fbAdmin.apps.length) {
    return res.status(500).json({
      error:
        "Firebase Admin ishga tushmadi. Vercel muhit o'zgaruvchilarini tekshiring (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).",
    });
  }

  try {
    const { title, body, url } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: "Sarlavha (title) kiritilishi shart." });
    }

    const db = fbAdmin.firestore();
    const tokensSnapshot = await db.collection("fcm_tokens").get();

    if (tokensSnapshot.empty) {
      return res.status(200).json({
        success: true,
        sentCount: 0,
        message: "Hech qanday obunachi topilmadi (fcm_tokens bo'sh).",
      });
    }

    const tokenDocMap = new Map();
    tokensSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const token = data?.token;
      if (token && typeof token === "string") {
        tokenDocMap.set(token, docSnap.ref);
      }
    });

    const tokens = Array.from(tokenDocMap.keys());
    if (tokens.length === 0) {
      return res.status(200).json({
        success: true,
        sentCount: 0,
        message: "Yaroqli tokenlar topilmadi.",
      });
    }

    const targetUrl = url || "/news";
    const notificationTitle = String(title);
    const notificationBody = String(body || "");

    // Sayt yopiq (background) bo'lganda ham darhol yetib borishi uchun yuqori ustuvorlik
    const messagePayload = {
      tokens,
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        title: notificationTitle,
        body: notificationBody,
        url: String(targetUrl),
      },
      webpush: {
        headers: {
          Urgency: "high",
          TTL: "86400", // 24 soat kutiladi
        },
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: "/SchoolTitleFor.png",
          badge: "/SchoolTitleFor.png",
          vibrate: [200, 100, 200],
          requireInteraction: true,
        },
        fcmOptions: {
          link: targetUrl,
        },
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          priority: "high",
        },
      },
    };

    const response = await fbAdmin.messaging().sendEachForMulticast(messagePayload);

    // Yaroqsiz yoki eskirgan tokenlarni Firestore'dan tozalash
    const staleDocsToDelete = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errorCode = resp.error.code;
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          const badToken = tokens[idx];
          const docRef = tokenDocMap.get(badToken);
          if (docRef) {
            staleDocsToDelete.push(docRef.delete());
          }
        }
      }
    });

    if (staleDocsToDelete.length > 0) {
      await Promise.allSettled(staleDocsToDelete);
    }

    return res.status(200).json({
      success: true,
      totalTokens: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      cleanedTokensCount: staleDocsToDelete.length,
      message: `${response.successCount}/${tokens.length} ta qurilmaga push yuborildi.`,
    });
  } catch (error) {
    console.error("send-push xatosi:", error);
    return res.status(500).json({
      error: error.message || "Push bildirishnoma yuborishda xatolik yuz berdi.",
    });
  }
}
