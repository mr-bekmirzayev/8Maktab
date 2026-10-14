// =============================================================================
// functions/src/sendNewsSms.ts
//
// HTTP Cloud Function: yangilik haqida barcha o'qituvchilarga SMS yuborish.
//
// POST so'rovi qabul qiladi:
//   { newsId?: string, title: string, description?: string }
//
// Jarayon:
//   1. Firestore "schools/school_8" dan hodimlar.phone raqamlarini oladi
//   2. Har bir raqamga Eskiz.uz SMS API orqali SMS yuboradi
//   3. Natijani JSON formatida qaytaradi: { success, sentTo, failed, errors }
//
// Sozlash (bir martalik, deploy oldidan):
//   firebase functions:config:set eskiz.token="TOKEN_BU_YERGA" eskiz.baseurl="https://notify.eskiz.uz/api"
// =============================================================================

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

// Firestore reference (admin.initializeApp() index.ts da chaqiriladi)
const db = admin.firestore();

// ─── Eskiz konfiguratsiyasi (Firebase Functions Config) ──────────────────────
// "firebase functions:config:set eskiz.token=... eskiz.baseurl=..." buyrug'i bilan o'rnatiladi.
// Token hech qachon frontend ga chiqmaydi — faqat serverda saqlanadi.
function getEskizConfig() {
  const config = functions.config();
  const token: string = config?.eskiz?.token ?? "";
  const baseUrl: string = config?.eskiz?.baseurl ?? "https://notify.eskiz.uz/api";
  const from: string = config?.eskiz?.from ?? "4546"; // Eskiz da ro'yxatdan o'tgan sender ID

  if (!token) {
    throw new Error(
      'Eskiz token topilmadi. ' +
      'Iltimos: firebase functions:config:set eskiz.token="YOUR_TOKEN"'
    );
  }
  return { token, baseUrl, from };
}

// ─── O'qituvchilar raqamlarini Firestore dan olish ───────────────────────────

interface Hodim {
  f_i_sh?: string;
  phone?: string;
  tel?: string;
  telefon?: string;
}

/**
 * Firestore "schools/school_8" hujjatidagi hodimlar massividan
 * telefon raqamlarini yig'ib massiv qilib qaytaradi.
 *
 * Raqam formatlari qabul qilinadi:
 *   +998901234567  |  998901234567  |  0901234567
 * Hammasi +998XXXXXXXXX formatiga o'giriladi.
 */
async function getTeacherPhones(): Promise<string[]> {
  const snap = await db.collection("schools").doc("school_8").get();

  if (!snap.exists) {
    console.warn("school_8 hujjati topilmadi.");
    return [];
  }

  const data = snap.data() as { hodimlar?: Hodim[] };
  const hodimlar: Hodim[] = Array.isArray(data?.hodimlar) ? data.hodimlar : [];

  const phones: string[] = [];

  for (const hodim of hodimlar) {
    // phone | tel | telefon maydonlaridan birini qabul qilamiz
    const raw: string | undefined = hodim.phone || hodim.tel || hodim.telefon;
    if (!raw) continue;

    const normalized = normalizePhone(raw);
    if (normalized) {
      phones.push(normalized);
    }
  }

  return phones;
}

/**
 * Turli formatlardagi O'zbekiston raqamini +998XXXXXXXXX ga o'giradi.
 * Noto'g'ri raqam bo'lsa null qaytaradi.
 */
function normalizePhone(raw: string): string | null {
  // Faqat raqamlarni qoldirish
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("998")) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `+998${digits.slice(1)}`;
  }
  // Allaqachon + bilan boshlagan holat
  if (digits.length === 12) {
    return `+${digits}`;
  }

  console.warn(`Noto'g'ri raqam formatida o'tkazib yuborildi: "${raw}"`);
  return null;
}

// ─── Bitta SMS yuborish ───────────────────────────────────────────────────────

/**
 * Eskiz.uz API orqali bitta raqamga SMS yuboradi.
 *
 * @param phone    +998XXXXXXXXX formatida raqam
 * @param message  SMS matni (160 belgidan oshsa qo'shimcha narxlanadi)
 * @param config   Eskiz token, baseUrl, from
 */
async function sendOneSms(
  phone: string,
  message: string,
  config: { token: string; baseUrl: string; from: string }
): Promise<void> {
  const params = new URLSearchParams();
  params.append("mobile_phone", phone);
  params.append("message", message);
  params.append("from", config.from);

  const response = await axios.post(
    `${config.baseUrl}/message/sms/send`,
    params,
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 10_000, // 10 sekund kutish
    }
  );

  // Eskiz "status":"error" qaytarsa
  if (response.data?.status === "error") {
    throw new Error(response.data?.message ?? "Eskiz API xatosi");
  }
}

// ─── SMS matn shabloni ────────────────────────────────────────────────────────

/**
 * Yangilik ma'lumotlari asosida SMS matnini tayyorlaydi.
 * Eskiz narxlash: 160 belgi = 1 SMS, undan ko'pi = 2 SMS.
 */
function buildSmsText(title: string, description?: string): string {
  const base = `📢 8-Maktab:\n${title}`;

  if (description && description.trim().length > 0) {
    const shortDesc =
      description.length > 90
        ? `${description.slice(0, 90)}...`
        : description;
    return `${base}\n${shortDesc}`;
  }

  return base;
}

// ─── Asosiy Cloud Function ────────────────────────────────────────────────────

export const sendNewsSms = functions.https.onRequest(
  async (req, res) => {
    // Faqat POST qabul qilinadi
    if (req.method !== "POST") {
      res.status(405).json({ error: "Faqat POST so'rovi qabul qilinadi" });
      return;
    }

    // CORS sarlavha (Vite dev server va production domain uchun)
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    const { newsId, title, description } = req.body as {
      newsId?: string;
      title?: string;
      description?: string;
    };

    // Sarlavha bo'lmasa xatolik
    if (!title || !title.trim()) {
      res.status(400).json({ error: "title maydoni majburiy" });
      return;
    }

    let eskizConfig: ReturnType<typeof getEskizConfig>;
    try {
      eskizConfig = getEskizConfig();
    } catch (configErr: unknown) {
      const msg = configErr instanceof Error ? configErr.message : String(configErr);
      console.error("Eskiz config xatosi:", msg);
      res.status(500).json({ error: msg });
      return;
    }

    try {
      // 1️⃣  O'qituvchilar raqamlarini olish
      const phones = await getTeacherPhones();

      if (phones.length === 0) {
        res.status(200).json({
          success: true,
          sentTo: 0,
          failed: 0,
          message: "O'qituvchilar ro'yxatida telefon raqamlari topilmadi.",
        });
        return;
      }

      // 2️⃣  SMS matnini tuzish
      const smsText = buildSmsText(title.trim(), description?.trim());

      console.log(
        `SMS yuborilmoqda: ${phones.length} ta raqamga. Matn: "${smsText.slice(0, 60)}..."`
      );

      // 3️⃣  SMS yuborish (parallel, lekin xatoliklar alohida saqlanadi)
      let sentTo = 0;
      let failed = 0;
      const errors: string[] = [];

      // Eskiz rate-limit: taxminan 30 SMS/sekund.
      // Katta ro'yxat uchun batch (50 tadan) ishlatamiz.
      const BATCH_SIZE = 50;
      for (let i = 0; i < phones.length; i += BATCH_SIZE) {
        const batch = phones.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((phone) => sendOneSms(phone, smsText, eskizConfig))
        );
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            sentTo++;
          } else {
            failed++;
            errors.push(`${batch[idx]}: ${result.reason?.message ?? "Noma'lum xato"}`);
            console.error(`SMS xatosi [${batch[idx]}]:`, result.reason);
          }
        });

        // Batches orasida 1 sekund kutish (rate-limit)
        if (i + BATCH_SIZE < phones.length) {
          await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        }
      }

      // 4️⃣  Natijani Firestore ga log qilish (ixtiyoriy, audit uchun)
      if (newsId) {
        try {
          await db
            .collection("news")
            .doc(newsId)
            .collection("smsLogs")
            .add({
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              totalPhones: phones.length,
              sentTo,
              failed,
              errors: errors.slice(0, 10), // maksimal 10 ta xato log
            });
        } catch (logErr) {
          console.warn("SMS log yozishda xato (kritik emas):", logErr);
        }
      }

      console.log(`SMS natijasi: ${sentTo} muvaffaqiyatli, ${failed} xato`);

      res.status(200).json({
        success: true,
        sentTo,
        failed,
        totalPhones: phones.length,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("sendNewsSms funksiyasida xato:", err);
      res.status(500).json({ error: "Ichki server xatosi", detail: msg });
    }
  }
);
