import admin from "firebase-admin";

// Serverless muhitda admin ilovasini faqat bir marta initialize qilish
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
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
    } catch (initErr) {
      console.error("Firebase Admin initialize xatosi:", initErr);
    }
  } else {
    console.warn("Firebase Admin muhit o'zgaruvchilari (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) to'liq emas.");
  }
}

export default async function handler(req, res) {
  // Faqat POST so'rovlarni qabul qilish
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Faqat POST so'rovlar qabul qilinadi." });
  }

  if (!admin.apps.length) {
    return res.status(500).json({
      error: "Firebase Admin ishga tushirilmagan. Muhit o'zgaruvchilarini tekshiring.",
    });
  }

  try {
    const { title, body, url } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: "Sarlavha (title) kiritilishi shart." });
    }

    const db = admin.firestore();
    const tokensSnapshot = await db.collection("fcm_tokens").get();

    if (tokensSnapshot.empty) {
      return res.status(200).json({
        success: true,
        sentCount: 0,
        message: "Hech qanday obunachi topilmadi.",
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
    const messagePayload = {
      tokens,
      notification: {
        title: String(title),
        body: String(body || ""),
      },
      webpush: {
        notification: {
          icon: "/SchoolTitleFor.png",
          badge: "/SchoolTitleFor.png",
        },
        fcmOptions: {
          link: targetUrl,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(messagePayload);

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
      successCount: response.successCount,
      failureCount: response.failureCount,
      cleanedTokensCount: staleDocsToDelete.length,
      message: `${response.successCount} ta qurilmaga push yuborildi.`,
    });
  } catch (error) {
    console.error("send-push xatosi:", error);
    return res.status(500).json({
      error: error.message || "Push bildirishnoma yuborishda xatolik yuz berdi.",
    });
  }
}
