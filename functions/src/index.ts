// =============================================================================
// functions/src/index.ts
//
// Firebase Cloud Functions — asosiy chiqish nuqtasi.
// Barcha funksiyalar shu yerdan export qilinadi.
// =============================================================================

import * as admin from "firebase-admin";

// Firebase Admin SDK ni bir marta ishga tushiramiz
admin.initializeApp();

// Barcha funksiyalarni shu yerdan re-export qilamiz
export { sendNewsSms } from "./sendNewsSms";
