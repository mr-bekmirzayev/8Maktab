/**
 * Bir martalik Firestore yuklash skripti
 * Ishlatish: node scripts/uploadData.js
 *
 * Bu skript:
 * 1. news-export.json -> "news" kolleksiyasiga har bir element alohida hujjat sifatida
 * 2. maktab-export.json -> "schools/school_8" hujjatiga barcha maydonlar
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const firebaseConfig = {
  apiKey: "AIzaSyAUs12XGEnXKe7haVon5p3CeFzZVYFdhDs",
  authDomain: "schoolnews-cd298.firebaseapp.com",
  projectId: "schoolnews-cd298",
  storageBucket: "schoolnews-cd298.firebasestorage.app",
  messagingSenderId: "831246809354",
  appId: "1:831246809354:web:3dc84f9ceebce81e8d62f3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadNews() {
  const newsFilePath = join(__dirname, "..", "news-export.json");
  const rawNews = readFileSync(newsFilePath, "utf-8");
  const newsData = JSON.parse(rawNews);

  // news massivini olish (turli formatlarni qo'llab-quvvatlash)
  let newsArray = [];
  if (Array.isArray(newsData)) {
    newsArray = newsData;
  } else if (Array.isArray(newsData?.news)) {
    newsArray = newsData.news;
  } else if (Array.isArray(newsData?.yangiliklar)) {
    newsArray = newsData.yangiliklar;
  } else if (newsData && typeof newsData === "object") {
    newsArray = [newsData];
  }

  if (newsArray.length === 0) {
    console.log("⚠️  news-export.json da yangiliklar topilmadi (bo'sh massiv). \"news\" kolleksiyasi bo'sh qoladi.");
    return;
  }

  console.log(`📰 ${newsArray.length} ta yangilik Firestore'ga yuklanmoqda...`);

  // Firestore writeBatch (500 ta limitni hisobga olgan holda)
  const BATCH_LIMIT = 499;
  let batch = writeBatch(db);
  let count = 0;
  let batchCount = 0;

  for (let i = 0; i < newsArray.length; i++) {
    const item = newsArray[i];

    // Hujjat ID: item.id mavjud bo'lsa foydalaniladi, bo'lmasa avtomatik
    const docId = item.id != null
      ? String(item.id)
      : `news_${i + 1}`;

    const docRef = doc(collection(db, "news"), docId);

    // null qiymatlarni o'chirib yubormaymiz — Firestore null qabul qiladi
    batch.set(docRef, item);
    count++;

    if (count >= BATCH_LIMIT) {
      await batch.commit();
      batchCount++;
      console.log(`  ✓ Batch ${batchCount} committed (${count} ta hujjat)`);
      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    batchCount++;
    console.log(`  ✓ Batch ${batchCount} committed (${count} ta hujjat)`);
  }

  console.log(`✅ Jami ${newsArray.length} ta yangilik "news" kolleksiyasiga yuklandi.`);
}

async function uploadSchool() {
  const schoolFilePath = join(__dirname, "..", "maktab-export.json");
  const rawSchool = readFileSync(schoolFilePath, "utf-8");
  const schoolData = JSON.parse(rawSchool);

  console.log("🏫 Maktab ma'lumotlari \"schools/school_8\" hujjatiga yuklanmoqda...");

  const schoolRef = doc(db, "schools", "school_8");
  await setDoc(schoolRef, schoolData);

  console.log('✅ Maktab ma\'lumotlari "schools/school_8" ga muvaffaqiyatli yuklandi.');
}

async function main() {
  console.log("🚀 Firestore yuklash boshlandi...\n");

  try {
    await uploadNews();
    console.log("");
    await uploadSchool();
    console.log("\n🎉 Barcha ma'lumotlar Firestore'ga muvaffaqiyatli yuklandi!");
  } catch (err) {
    console.error("❌ Xatolik:", err);
    process.exit(1);
  }

  process.exit(0);
}

main();
