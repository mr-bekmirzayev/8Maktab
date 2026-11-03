# 📱 SMS integratsiyasi — sozlash yo'riqnomasi

## Qanday ishlaydi?

```
[Admin panel]
     │  Yangilik saqlanadi (smsMode = "B" yoki "C")
     ▼
[src/utils/eskizSmsService.js]  ──POST──►  [/api/send-sms]  (Vercel Serverless)
                                                │
                                                │ 1. Eskiz login → token (keshlanadi)
                                                │ 2. Firestore schools/school_8 → hodimlar telefonlari
                                                │ 3. Raqamlarni tekshirish + dublikatlarni olib tashlash
                                                ▼
                                        [Eskiz.uz SMS API]
                                                │
                                                ▼
                                   📱 O'qituvchilar telefoniga SMS
```

Lokal rejimda `vite.config.js` dagi dev middleware `/api/send-sms` ni ishga tushiradi,
shuning uchun `npm run dev` da ham SMS yuborishni sinab ko'rish mumkin.

---

## 1-qadam: Eskiz.uz hisobi

Eskiz kabinetida:

- hisob tasdiqlangan bo'lishi;
- balans yetarli bo'lishi;
- jo'natuvchi nomi (`from`) tasdiqlangan bo'lishi kerak.

Odatda standart jo'natuvchi — `4546`. Agar `ESKIZ_FROM` tasdiqlanmagan bo'lsa,
server avtomatik `4546` bilan bir marta qayta urinadi.

---

## 2-qadam: Muhit o'zgaruvchilari

`.env.local` (lokal) yoki Vercel → Project Settings → Environment Variables:

```env
ESKIZ_EMAIL=your-email@example.com
ESKIZ_PASSWORD=your-password
ESKIZ_FROM=4546
```

Ixtiyoriy:

```env
# Tayyor token (bo'lmasa login avtomatik bajariladi)
ESKIZ_TOKEN=

# Eskiz API manzili
ESKIZ_BASE_URL=https://notify.eskiz.uz/api

# Sender rad etilsa ishlatiladigan zaxira nom
ESKIZ_FALLBACK_FROM=4546

# Sayt manzili (SMS matnidagi havola uchun)
SITE_URL=https://8-maktab.vercel.app

# Limitlar
SMS_MAX_RECIPIENTS=300
SMS_CONCURRENCY=4

# Firebase ID token talab qilish (tavsiya etiladi)
SMS_REQUIRE_AUTH=true
```

> ⚠️ Token va parolni hech qachon kodga yozmang yoki GitHub ga yubormang.
> `.env.local` `.gitignore` ichida.

Firestore dan raqamlarni olish va `SMS_REQUIRE_AUTH=true` rejimida adminni
tekshirish uchun Firebase Admin ham sozlanadi:

```env
FIREBASE_PROJECT_ID=schoolnews-cd298
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@schoolnews-cd298.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 3-qadam: O'qituvchilar telefon raqamlari

Firestore `schools/school_8` hujjatidagi `hodimlar` massivida har bir xodim uchun
`telefon` (yoki `phone`, `tel`, `raqam`, `mob`) maydoni bo'lishi kerak:

```json
{
  "f_i_sh": "Karimov Alisher",
  "fani": "Matematika",
  "telefon": "+998901234567"
}
```

Admin panel → Ustozlar → tahrirlash orqali ham kiritish mumkin.

Qabul qilinadigan formatlar:

- `+998 90 123 45 67`
- `998901234567`
- `8 998 90 123 45 67`
- `0901234567`
- `901234567`

Noto'g'ri yoki mavjud bo'lmagan raqamlarga SMS yuborilmaydi va pul sarflanmaydi.

---

## 4-qadam: Sinash

```powershell
npm run dev
```

1. Admin panelga kiring.
2. Yangilik qo'shing.
3. `B — Sayt + SMS` yoki `C — Ikki variant` ni tanlang.
4. Saqlang. Natija (`sentTo`, `failed`, `invalidCount`) panelda ko'rsatiladi.

---

## Xavfsizlik va sifat

- ✅ Eskiz tokeni va paroli faqat serverda saqlanadi.
- ✅ Kodda hardcoded token/parol yo'q.
- ✅ Telefon raqamlari tekshiriladi, dublikatlar olib tashlanadi.
- ✅ SMS matni GSM-7 formatida (emoji yo'q) — narx oshmaydi.
- ✅ SMS matni 300 belgidan oshmaydi (2 segment).
- ✅ Token eskirsa avtomatik qayta login qilinadi.
- ✅ So'rovlar soni cheklangan (rate limit).
- ✅ `SMS_REQUIRE_AUTH=true` bo'lsa faqat tizimga kirgan admin SMS yuboradi.
