/**
 * Firestore ma'lumot olish utility.
 *
 * Eski JSONBin fetchWithJsonbinCache o'rnini bosadi.
 * Komponentlarga eski strukturadagi ma'lumot qaytariladi:
 *   { data, fromCache, isUpdated }
 *
 * - 12 soniyalik timeout (Promise.race)
 * - LocalStorage kesh (TTL asosida)
 */

import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

/** 12 soniyalik timeout promise */
function withTimeout(promise, ms = 12000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Firestore so'rovi ${ms / 1000} soniyada javob bermadi`)),
      ms
    )
  );
  return Promise.race([promise, timeout]);
}

// ─── LocalStorage yordamchi funksiyalari ──────────────────────────────────────

function readCache(cacheKey) {
  try {
    const raw = localStorage.getItem(cacheKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(cacheKey, data, ttlMs) {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data, fetchedAt: Date.now(), ttlMs })
    );
  } catch {
    // localStorage to'liq bo'lsa e'tibor bermaymiz
  }
}

function isCacheValid(cached, ttlMs) {
  if (!cached?.data || !cached?.fetchedAt) return false;
  const age = Date.now() - cached.fetchedAt;
  return age < (cached.ttlMs ?? ttlMs);
}

// ─── Yangiliklar ("news" kolleksiyasi) ───────────────────────────────────────

/**
 * Firestore "news" kolleksiyasidan barcha hujjatlarni oladi.
 * Natija eski JSONBin formatida: { data: [...], fromCache, isUpdated }
 *
 * data - yangiliklar massivi (har bir element hujjat ma'lumotlari + id)
 */
export async function fetchNewsFromFirestore({
  cacheKey = "news-firestore-cache",
  ttlMs = 15 * 60 * 1000, // 15 daqiqa
  forceFetch = false,
} = {}) {
  // 1. Keshni tekshirish
  const cached = readCache(cacheKey);
  if (!forceFetch && isCacheValid(cached, ttlMs)) {
    return { data: cached.data, fromCache: true, isUpdated: false };
  }

  // 2. Firestore dan olish (12s timeout)
  const snapshot = await withTimeout(getDocs(collection(db, "news")));

  const newsArray = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  // 3. Keshni yangilash
  const cachedDataStr = cached?.data ? JSON.stringify(cached.data) : null;
  const newDataStr = JSON.stringify(newsArray);
  const isUpdated = cachedDataStr !== newDataStr;

  writeCache(cacheKey, newsArray, ttlMs);

  return { data: newsArray, fromCache: false, isUpdated };
}

// ─── Maktab ma'lumotlari ("schools/school_8" hujjati) ────────────────────────

/**
 * Firestore "schools/school_8" hujjatidan maktab ma'lumotlarini oladi.
 * Natija eski JSONBin formatida: { data: {...}, fromCache, isUpdated }
 *
 * data - maktab ma'lumotlari obyekti (TeachersSection foydalanadi)
 */
export async function fetchSchoolFromFirestore({
  cacheKey = "school-firestore-cache",
  ttlMs = 1.5 * 24 * 60 * 60 * 1000, // 1.5 kun
  forceFetch = false,
} = {}) {
  // 1. Keshni tekshirish
  const cached = readCache(cacheKey);
  if (!forceFetch && isCacheValid(cached, ttlMs)) {
    return { data: cached.data, fromCache: true, isUpdated: false };
  }

  // 2. Firestore dan olish (12s timeout)
  const docSnap = await withTimeout(getDoc(doc(db, "schools", "school_8")));

  if (!docSnap.exists()) {
    // Hujjat yo'q — keshda mavjud bo'lsa uni qaytaramiz
    if (cached?.data) {
      return { data: cached.data, fromCache: true, isUpdated: false };
    }
    throw new Error("Firestore: schools/school_8 hujjati topilmadi");
  }

  const schoolData = docSnap.data();

  // 3. Keshni yangilash
  const cachedDataStr = cached?.data ? JSON.stringify(cached.data) : null;
  const newDataStr = JSON.stringify(schoolData);
  const isUpdated = cachedDataStr !== newDataStr;

  writeCache(cacheKey, schoolData, ttlMs);

  return { data: schoolData, fromCache: false, isUpdated };
}
