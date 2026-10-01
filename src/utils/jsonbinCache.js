/**
 * JSONBin.io bilan ishlash va LocalStorage keshini boshqarish uchun yordamchi utility.
 * 
 * 1. Birinchi localStorage dan ma'lumotni o'qiydi.
 * 2. Agar localStorage da ma'lumot bo'lsa va TTL muddati o'tmagan bo'lsa -> SERVERGA REQUEST YUBORILMAYDI (Trafik tejaladi)!
 * 3. TTL muddati o'tgan bo'lsa yoki localStorage da ma'lumot bo'lmasa -> JSONBin ga request yuboradi.
 * 4. Serverdan kelgan ma'lumotni LocalStorage dagi ma'lumot bilan solishtiradi:
 *    - Bir xil bo'lsa: Kesh vaqtini (fetchedAt) yangilaydi, shunda kelgusi refreshlarda qayta request ketmaydi.
 *    - Bir xil bo'lmasa: LocalStorage ni yangi ma'lumot bilan yangilaydi.
 */

export async function fetchWithJsonbinCache({
  binId,
  masterKey,
  cacheKey,
  ttlMs = 15 * 60 * 1000, // 15 daqiqa kesh muddati
  forceFetch = false,
}) {
  let cached = null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      cached = JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`[${cacheKey}] LocalStorage o'qishda xatolik:`, e);
  }

  const now = Date.now();
  const cacheAge = cached?.fetchedAt ? now - cached.fetchedAt : Infinity;

  // 1. Agar keshda ma'lumot bor va TTL muddati tugamagan bo'lsa -> SERVERGA REQUEST JONATILMAYDI!
  if (cached && cached.data && cacheAge < ttlMs && !forceFetch) {
    return {
      data: cached.data,
      fromCache: true,
      isUpdated: false,
    };
  }

  // 2. Aks holda serverga request yuboriladi
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: {
        "X-Master-Key": masterKey,
      },
    });

    if (!response.ok) {
      if (cached?.data) {
        return { data: cached.data, fromCache: true, isUpdated: false, error: response.statusText };
      }
      throw new Error(`HTTP error: ${response.status}`);
    }

    const resData = await response.json();
    const serverRecord = resData?.record ?? resData;
    const serverUpdatedAt =
      resData?.metadata?.updatedAt ||
      resData?.meta?.updatedAt ||
      resData?.updatedAt ||
      null;

    // 3. LocalStorage va server ma'lumotlarini solishtirish
    const cachedDataStr = cached?.data ? JSON.stringify(cached.data) : null;
    const serverDataStr = JSON.stringify(serverRecord);

    const isIdentical = cachedDataStr === serverDataStr;

    if (isIdentical && cached?.data) {
      // Bazadagi va localstoragedagi ma'lumot bir xil!
      // Faqat kesh vaqtini (fetchedAt) yangilab qo'yamiz
      const updatedCache = {
        ...cached,
        fetchedAt: now,
        serverUpdatedAt: serverUpdatedAt || cached.serverUpdatedAt,
      };
      localStorage.setItem(cacheKey, JSON.stringify(updatedCache));

      return {
        data: cached.data,
        fromCache: false,
        isUpdated: false,
      };
    }

    // 4. Ma'lumotlar har xil yoki kesh mavjud emas -> LocalStorage ga saqlash
    const newCacheObj = {
      data: serverRecord,
      fetchedAt: now,
      serverUpdatedAt,
    };
    localStorage.setItem(cacheKey, JSON.stringify(newCacheObj));

    return {
      data: serverRecord,
      fromCache: false,
      isUpdated: true,
    };
  } catch (err) {
    console.warn(`[${cacheKey}] JSONBin yuklashda xatolik:`, err);
    if (cached?.data) {
      return { data: cached.data, fromCache: true, isUpdated: false, error: err.message };
    }
    throw err;
  }
}
