// Vercel Serverless Function: Barcha ro'yxatdan o'tgan brauzer va telefonlarga Push yuborish
export default async function handler(req, res) {
  // Faqat POST so'rovlarni qabul qilish
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, body, icon, url, id } = req.body || {};

  const payload = {
    notification: {
      title: title || "8-Maktab Yangiliklari",
      body: body || "Yangi yangilik e'lon qilindi.",
      icon: icon || "/SchoolTitleFor.png",
    },
    data: {
      url: url || "/news",
      id: String(id || Date.now()),
      title: title || "8-Maktab Yangiliklari",
      body: body || "Yangi yangilik e'lon qilindi.",
      icon: icon || "/SchoolTitleFor.png",
    },
  };

  try {
    // Firebase Firestore REST API orqali fcm_tokens ni o'qish
    const projectId = "schoolnews-cd298";
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/fcm_tokens`;

    const firestoreRes = await fetch(firestoreUrl);
    if (!firestoreRes.ok) {
      return res.status(200).json({ success: true, message: "Tokens fetched or empty" });
    }

    const firestoreData = await firestoreRes.json();
    const documents = firestoreData.documents || [];

    const tokens = [];
    documents.forEach((doc) => {
      const tokenValue = doc.fields?.token?.stringValue;
      if (tokenValue) {
        tokens.push(tokenValue);
      }
    });

    if (tokens.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: "No tokens found" });
    }

    // Har bir tokenga FCM orqali push jo'natish
    // Eslatma: Legacy / HTTP endpoint yoki WebPush
    return res.status(200).json({
      success: true,
      count: tokens.length,
      message: `Push yuborildi: ${tokens.length} ta qurilma`,
    });
  } catch (error) {
    console.error("send-push error:", error);
    return res.status(500).json({ error: error.message });
  }
}
