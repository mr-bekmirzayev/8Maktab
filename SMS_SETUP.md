# 📱 SMS Integratsiya — Ishga Tushirish Yo'riqnomasi

## Nima yaratildi?

| Fayl | Maqsad |
|------|--------|
| `src/utils/eskizSmsService.js` | Eskiz.uz SMS API bilan ishlash moduli |
| `functions/src/sendNewsSms.ts` | Firebase Cloud Function — backend SMS yuboruvchi |
| `functions/src/index.ts` | Cloud Functions kirish nuqtasi |
| `functions/package.json` | Functions papkasi uchun npm konfiguratsiyasi |
| `functions/tsconfig.json` | TypeScript konfiguratsiyasi |
| `firebase.json` | Firebase loyiha konfiguratsiyasi |

`AdminDashboard.jsx` ga qo'shildi:
- **SMS variant paneli** (A / B / C tugmalar)
- **`handleSaveNews`** funksiyasiga SMS yuborish logikasi
- **`smsSending`** holatida tugmalar disabled bo'ladi

---

## 1-qadam: O'qituvchilarga telefon raqami qo'shish

Firestore `schools/school_8` hujjatidagi `hodimlar` massivida har bir xodim obyektiga `phone` maydoni kerak:

```json
{
  "f_i_sh": "Karimov Alisher",
  "fani": "Matematika",
  "phone": "+998901234567"
}
```

Admim panel orqali xodim qo'shishda ham `phone` maydoni formaga qo'shishingiz mumkin (keyingi qadamda).

---

## 2-qadam: Functions papkasida paketlarni o'rnatish

```powershell
cd "c:\Users\user\Desktop\my files\Loyihalarim\8 - Maktab App\8-Maktab\functions"
npm install
```

---

## 3-qadam: Firebase CLI o'rnatish (agar yo'q bo'lsa)

```powershell
npm install -g firebase-tools
firebase login
```

---

## 4-qadam: Eskiz.uz tokenini xavfsiz sozlash (ENG MUHIM!)

```powershell
# Loyiha papkasiga o'ting
cd "c:\Users\user\Desktop\my files\Loyihalarim\8 - Maktab App\8-Maktab"

# Firebase loyihani tanlash
firebase use schoolnews-cd298

# Token va URL ni sozlash (TOKEN_BU_YERGA o'rniga haqiqiy tokenni yozing)
firebase functions:config:set eskiz.token="TOKEN_BU_YERGA" eskiz.baseurl="https://notify.eskiz.uz/api" eskiz.from="4546"
```

> ⚠️ Token hech qachon `git commit` qilinmasin!  
> `firebase functions:config:set` uni Firebase serverida maxfiy saqlaydi.

---

## 5-qadam: Cloud Function ni deploy qilish

```powershell
cd "c:\Users\user\Desktop\my files\Loyihalarim\8 - Maktab App\8-Maktab"
firebase deploy --only functions
```

Deploy muvaffaqiyatli bo'lgandan keyin URL ko'rinadi:
```
Function URL (sendNewsSms): https://us-central1-schoolnews-cd298.cloudfunctions.net/sendNewsSms
```

---

## 6-qadam: `eskizSmsService.js` ni tekshiring

`src/utils/eskizSmsService.js` faylida `CLOUD_FUNCTION_URL` allaqachon to'g'ri URL bilan to'ldirilgan:
```js
const CLOUD_FUNCTION_URL =
  "https://us-central1-schoolnews-cd298.cloudfunctions.net/sendNewsSms";
```

Agar URL boshqacha bo'lsa — shu yerda yangilang.

---

## Qanday ishlaydi?

```
[Admin Panel]
     │
     │ Variant B yoki C tanlansa
     ▼
[eskizSmsService.js]  ──POST──►  [Cloud Function: sendNewsSms]
                                          │
                                          │ 1. Firestore dan o'qituvchilar raqamlari
                                          │ 2. Eskiz.uz API ga yuborish
                                          │ 3. news/{id}/smsLogs ga yozish
                                          ▼
                                  [Eskiz.uz SMS API]
                                          │
                                          ▼
                             📱 O'qituvchilar telefoniga SMS
```

---

## Xavfsizlik

- ✅ Eskiz token **faqat Cloud Function serverida** saqlanadi
- ✅ Frontend kodi tokenni ko'rmaydi
- ✅ SMS yuborish faqat **autentifikatsiya qilingan admin** tomonidan ishga tushiriladi
- ✅ Firestore da har bir SMS yuborish loglanadi (`news/{id}/smsLogs`)

---

## Kelajakdagi yaxshilanishlar

- O'qituvchi qo'shish formasiga `phone` maydoni qo'shish
- `maktab-export.json` dan raqamlarni Firestore ga bir martalik import qilish
- SMS yuborish natijasini admin panelda ko'rsatish (sentTo / failed)
