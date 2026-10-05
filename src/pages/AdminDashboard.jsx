import React, { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import AdminLogin from "./AdminLogin";
import { HashLoader } from "react-spinners";
import { broadcastPushNotification } from "../utils/pushNotificationService";
import {
  FiLogOut,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiUsers,
  FiFileText,
  FiRefreshCw,
  FiUpload,
} from "react-icons/fi";

// Toifalarni avtomatik hisoblash yordamchi funksiyasi
function calculateToifalar(hodimlar) {
  const counts = {
    oliy_toifali: 0,
    bir_toifali: 0,
    ikki_toifali: 0,
    mutaxassis: 0,
    orta_maxsus: 0,
  };

  hodimlar.forEach((h) => {
    const t = (h.toifasi || "").toString().trim().toLowerCase();
    if (t === "oliy" || t === "oliy_toifali") {
      counts.oliy_toifali++;
    } else if (t === "1" || t === "1-toifa" || t === "bir_toifali" || t === "bir") {
      counts.bir_toifali++;
    } else if (t === "2" || t === "2-toifa" || t === "ikki_toifali" || t === "ikki") {
      counts.ikki_toifali++;
    } else if (t === "m" || t === "mutaxassis") {
      counts.mutaxassis++;
    } else {
      counts.orta_maxsus++;
    }
  });

  return counts;
}

// Rasmni avtomatik o'lchamini moslab, sifatini saqlagan holda ixchamlashtirish
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Faqat rasm formatidagi fayllarni yuklashingiz mumkin (JPG, PNG, WEBP)"));
    }

    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error("Rasm hajmi juda katta (maksimal 15MB)"));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Rasmni o'qishda xatolik yuz berdi"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Faylni o'qishda xatolik yuz berdi"));
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("news"); // "news" | "teachers"

  // --- Yangiliklar State ---
  const [newsList, setNewsList] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newsForm, setNewsForm] = useState({
    title: "",
    description: "",
    demand: "",
    date: new Date().toISOString().slice(0, 10),
    images: [],
    author: "",
  });
  const [urlInput, setUrlInput] = useState("");
  const [isNewsFormOpen, setIsNewsFormOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // --- Maktab / Xodimlar State ---
  const [schoolData, setSchoolData] = useState(null);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [teacherForm, setTeacherForm] = useState({
    f_i_sh: "",
    lavozimi: "O'qituvchi",
    fani: "",
    malumoti: "oliy",
    mutaxassisligi: "",
    toifasi: "M",
    asosiy_yoki_urindosh: "asosiy",
  });
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);

  const [actionMessage, setActionMessage] = useState(null);

  const showNotification = (msg, isError = false) => {
    setActionMessage({ text: msg, isError });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  // Auth holatini kuzatish
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Yangiliklarni Firestore dan yuklash
  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const snap = await getDocs(collection(db, "news"));
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setNewsList(items);
    } catch (err) {
      console.error("Yangiliklarni yuklash xatosi:", err);
      showNotification("Yangiliklarni yuklashda xatolik yuz berdi", true);
    } finally {
      setNewsLoading(false);
    }
  };

  // Maktab ma'lumotlarini Firestore dan yuklash
  const loadSchoolData = async () => {
    setTeachersLoading(true);
    try {
      const snap = await getDoc(doc(db, "schools", "school_8"));
      if (snap.exists()) {
        setSchoolData(snap.data());
      } else {
        setSchoolData({
          maktab_raqami: 8,
          tuman: "Uychi tumani",
          viloyat: "Namangan viloyati",
          oqituvchilar_soni: 0,
          toifalar: { oliy_toifali: 0, bir_toifali: 0, ikki_toifali: 0, mutaxassis: 0, orta_maxsus: 0 },
          hodimlar: [],
        });
      }
    } catch (err) {
      console.error("Maktab ma'lumotlarini yuklash xatosi:", err);
      showNotification("Maktab ma'lumotlarini yuklashda xatolik yuz berdi", true);
    } finally {
      setTeachersLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNews();
      loadSchoolData();
    }
  }, [user]);

  // --- Yangiliklar amallari ---
  const handleSaveNews = async (e) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.title.trim()) {
      showNotification("Sarlavha kiritilishi shart!", true);
      return;
    }

    try {
      const currentImages = Array.isArray(newsForm.images) ? newsForm.images.slice(0, 5) : [];

      const dataToSave = {
        title: (newsForm.title || "").trim(),
        description: (newsForm.description || "").trim() || null,
        demand: (newsForm.demand || "").trim() || null,
        date: newsForm.date || new Date().toISOString().slice(0, 10),
        images: currentImages,
        image: currentImages.length > 0 ? currentImages[0] : null,
        author: (newsForm.author || "").trim() || null,
      };

      if (editingNews) {
        // Tahrirlash
        const newsRef = doc(db, "news", editingNews.id);
        await updateDoc(newsRef, {
          ...dataToSave,
          updatedAt: new Date().toISOString(),
        });
        showNotification("Yangilik muvaffaqiyatli tahrirlandi!");
      } else {
        // Yangi qo'shish
        const addedDocRef = await addDoc(collection(db, "news"), {
          ...dataToSave,
          createdAt: new Date().toISOString(),
        });
        showNotification("Yangi yangilik muvaffaqiyatli qo'shildi!");

        // Tab yopiq bo'lsa ham barcha foydalanuvchilar qurilmalariga Push xabarnoma yuborish
        broadcastPushNotification({
          title: "8-Maktab: " + dataToSave.title,
          body: dataToSave.description || "Maktabimizda yangi yangilik e'lon qilindi.",
          icon: dataToSave.image || "/SchoolTitleFor.png",
          url: "/news",
          id: addedDocRef?.id || String(Date.now()),
        }).catch((e) => console.warn("Push broadcast error:", e));
      }

      // Keshni tozalash
      localStorage.removeItem("news-firestore-cache");
      localStorage.removeItem("news-section-cache");

      setNewsForm({
        title: "",
        description: "",
        demand: "",
        date: new Date().toISOString().slice(0, 10),
        images: [],
        author: "",
      });
      setUrlInput("");
      setEditingNews(null);
      setIsNewsFormOpen(false);
      loadNews();
    } catch (err) {
      console.error("Yangilikni saqlash xatosi:", err);
      showNotification(`Xatolik: ${err.code || err.message || "Yangilikni saqlab bo'lmadi"}`, true);
    }
  };

  const handleDeleteNews = async (id, title) => {
    if (!window.confirm(`Haqiqatan ham "${title}" yangiligini o'chirmoqchimisiz?`)) return;

    try {
      await deleteDoc(doc(db, "news", id));
      localStorage.removeItem("news-firestore-cache");
      localStorage.removeItem("news-section-cache");
      showNotification("Yangilik o'chirildi!");
      loadNews();
    } catch (err) {
      console.error("Yangilik o'chirish xatosi:", err);
      showNotification("Yangilikni o'chirishda xatolik", true);
    }
  };

  const handleEditNewsClick = (item) => {
    setEditingNews(item);
    const existingImages = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : (item.image || item.rasm || item.img ? [item.image || item.rasm || item.img] : []);

    setNewsForm({
      title: item.title || item.sarlavha || "",
      description: item.description || item.tavsif || item.content || "",
      demand: item.demand || item.talab || "",
      date: item.date || item.sana || new Date().toISOString().slice(0, 10),
      images: existingImages.slice(0, 5),
      author: item.author || item.muallif || "",
    });
    setUrlInput("");
    setIsNewsFormOpen(true);
  };

  // Qurilmadan rasm fayllarini tanlash (5 tagacha)
  const handleImageFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = (newsForm.images || []).length;
    const availableSlots = 5 - currentCount;
    if (availableSlots <= 0) {
      showNotification("Maksimal 5 ta rasm yuklash mumkin!", true);
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      showNotification(`Faqat ${availableSlots} ta rasm olindi (jami chegara: 5 ta).`, false);
    }

    setUploadingImage(true);
    try {
      const processedImages = [];
      for (const file of filesToProcess) {
        const base64Data = await processImageFile(file);
        if (base64Data) {
          processedImages.push(base64Data);
        }
      }

      setNewsForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...processedImages].slice(0, 5),
      }));
      showNotification(`${processedImages.length} ta rasm muvaffaqiyatli tanlandi!`);
    } catch (err) {
      console.error("Rasm yuklash xatosi:", err);
      showNotification(err.message || "Rasm yuklashda xatolik yuz berdi", true);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // URL orqali rasm qo'shish
  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    if ((newsForm.images || []).length >= 5) {
      showNotification("Maksimal 5 ta rasm qo'shish mumkin!", true);
      return;
    }

    setNewsForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), urlInput.trim()].slice(0, 5),
    }));
    setUrlInput("");
    showNotification("Rasm havolasi qo'shildi!");
  };

  // Rasmni o'chirish
  const handleRemoveImage = (indexToRemove) => {
    setNewsForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== indexToRemove),
    }));
  };

  // --- Xodimlar amallari ---
  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.f_i_sh.trim()) {
      showNotification("F.I.SH kiritilishi shart!", true);
      return;
    }

    try {
      const currentHodimlar = Array.isArray(schoolData?.hodimlar) ? [...schoolData.hodimlar] : [];

      if (editingIndex !== null) {
        // Mavjud xodimni tahrirlash
        currentHodimlar[editingIndex] = {
          ...currentHodimlar[editingIndex],
          ...teacherForm,
        };
      } else {
        // Yangi xodim qo'shish
        const nextTr = currentHodimlar.length > 0
          ? Math.max(...currentHodimlar.map((h) => h.t_r || 0)) + 1
          : 1;
        currentHodimlar.push({
          t_r: nextTr,
          ...teacherForm,
        });
      }

      // Avtomatik qayta hisoblash
      const newOqituvchilarSoni = currentHodimlar.length;
      const newToifalar = calculateToifalar(currentHodimlar);

      const schoolRef = doc(db, "schools", "school_8");
      await setDoc(
        schoolRef,
        {
          ...schoolData,
          hodimlar: currentHodimlar,
          oqituvchilar_soni: newOqituvchilarSoni,
          toifalar: newToifalar,
        },
        { merge: true }
      );

      // Keshni tozalash
      localStorage.removeItem("school-firestore-cache");
      localStorage.removeItem("teachers-section-cache");

      showNotification(
        editingIndex !== null
          ? "Xodim ma'lumotlari yangilandi!"
          : "Yangi xodim muvaffaqiyatli qo'shildi!"
      );

      setTeacherForm({
        f_i_sh: "",
        lavozimi: "O'qituvchi",
        fani: "",
        malumoti: "oliy",
        mutaxassisligi: "",
        toifasi: "M",
        asosiy_yoki_urindosh: "asosiy",
      });
      setEditingIndex(null);
      setEditingTeacher(null);
      setIsTeacherFormOpen(false);
      loadSchoolData();
    } catch (err) {
      console.error("Xodimni saqlash xatosi:", err);
      showNotification("Xodimni saqlashda xatolik yuz berdi", true);
    }
  };

  const handleDeleteTeacher = async (index, fish) => {
    if (!window.confirm(`Haqiqatan ham "${fish}" xodimini ro'yxatdan o'chirmoqchimisiz?`)) return;

    try {
      const currentHodimlar = [...(schoolData?.hodimlar || [])];
      currentHodimlar.splice(index, 1);

      // Avtomatik hisoblash
      const newOqituvchilarSoni = currentHodimlar.length;
      const newToifalar = calculateToifalar(currentHodimlar);

      const schoolRef = doc(db, "schools", "school_8");
      await setDoc(
        schoolRef,
        {
          ...schoolData,
          hodimlar: currentHodimlar,
          oqituvchilar_soni: newOqituvchilarSoni,
          toifalar: newToifalar,
        },
        { merge: true }
      );

      localStorage.removeItem("school-firestore-cache");
      localStorage.removeItem("teachers-section-cache");

      showNotification("Xodim o'chirildi va statistikalar avtomatik qayta hisoblandi!");
      loadSchoolData();
    } catch (err) {
      console.error("Xodimni o'chirish xatosi:", err);
      showNotification("Xodimni o'chirishda xatolik yuz berdi", true);
    }
  };

  const handleEditTeacherClick = (item, index) => {
    setEditingTeacher(item);
    setEditingIndex(index);
    setTeacherForm({
      f_i_sh: item.f_i_sh || "",
      lavozimi: item.lavozimi || "O'qituvchi",
      fani: item.fani || "",
      malumoti: item.malumoti || "oliy",
      mutaxassisligi: item.mutaxassisligi || "",
      toifasi: item.toifasi || "M",
      asosiy_yoki_urindosh: item.asosiy_yoki_urindosh || "asosiy",
    });
    setIsTeacherFormOpen(true);
  };

  if (authChecking) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          color: "#94a3b8",
        }}
      >
        <HashLoader color="#f97316" size={45} />
        <p>Admin panel yuklanmoqda...</p>
      </div>
    );
  }

  // Agar foydalanuvchi tizimga kirmagan bo'lsa Login sahifasini ko'rsatish
  if (!user) {
    return <AdminLogin onLoginSuccess={() => loadNews()} />;
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px 16px 80px",
        color: "#f8fafc",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(249, 115, 22, 0.25)",
          borderRadius: "20px",
          padding: "18px 24px",
          marginBottom: "24px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "700", color: "#f8fafc" }}>
            8-Maktab Boshqaruv Paneli
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
            Admin: <strong style={{ color: "#fb923c" }}>{user.email}</strong>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => signOut(auth)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              color: "#f87171",
              fontSize: "13.5px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <FiLogOut size={16} /> Chiqish
          </button>
        </div>
      </header>

      {/* Bildirishnoma xabari */}
      {actionMessage && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "14px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500",
            background: actionMessage.isError
              ? "rgba(239, 68, 68, 0.15)"
              : "rgba(34, 197, 94, 0.15)",
            border: `1px solid ${
              actionMessage.isError ? "rgba(239, 68, 68, 0.35)" : "rgba(34, 197, 94, 0.35)"
            }`,
            color: actionMessage.isError ? "#f87171" : "#4ade80",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {actionMessage.isError ? <FiX size={18} /> : <FiCheck size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
          paddingBottom: "12px",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("news")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "12px",
            border: "none",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            background:
              activeTab === "news"
                ? "linear-gradient(135deg, #ea580c, #f97316)"
                : "rgba(30, 41, 59, 0.6)",
            color: activeTab === "news" ? "#ffffff" : "#94a3b8",
            boxShadow:
              activeTab === "news" ? "0 4px 14px rgba(249, 115, 22, 0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          <FiFileText size={16} /> Yangiliklar ({newsList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("teachers")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "12px",
            border: "none",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            background:
              activeTab === "teachers"
                ? "linear-gradient(135deg, #ea580c, #f97316)"
                : "rgba(30, 41, 59, 0.6)",
            color: activeTab === "teachers" ? "#ffffff" : "#94a3b8",
            boxShadow:
              activeTab === "teachers" ? "0 4px 14px rgba(249, 115, 22, 0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          <FiUsers size={16} /> Xodimlar & Maktab ({schoolData?.hodimlar?.length || 0})
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. YANGILIKLAR BOSHQARUVI TAB                            */}
      {/* ======================================================== */}
      {activeTab === "news" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#f8fafc" }}>
              Yangiliklar ro'yxati
            </h2>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={loadNews}
                title="Qayta yuklash"
                style={{
                  padding: "9px 14px",
                  background: "rgba(30, 41, 59, 0.8)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "12px",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                }}
              >
                <FiRefreshCw size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingNews(null);
                  setNewsForm({
                    title: "",
                    description: "",
                    date: new Date().toISOString().slice(0, 10),
                    image: "",
                    author: "",
                  });
                  setIsNewsFormOpen(true);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  background: "linear-gradient(135deg, #ea580c, #f97316)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                }}
              >
                <FiPlus size={16} /> Yangi yangilik qo'shish
              </button>
            </div>
          </div>

          {/* Yangilik qo'shish / tahrirlash formasi (Modal / Accordion) */}
          {isNewsFormOpen && (
            <div
              style={{
                background: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(249, 115, 22, 0.35)",
                borderRadius: "20px",
                padding: "24px",
                marginBottom: "24px",
                boxShadow: "0 14px 35px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", color: "#fb923c", fontWeight: "700" }}>
                  {editingNews ? "Yangilikni tahrirlash" : "Yangi yangilik yaratish"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewsFormOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveNews} style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                    Sarlavha (title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    placeholder="Masalan: Maktabimizda umumxalq bayrami nishonlandi"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 14px",
                      background: "rgba(30, 41, 59, 0.9)",
                      border: "1px solid rgba(148, 163, 184, 0.25)",
                      borderRadius: "10px",
                      color: "#f8fafc",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                    Tavsif / Matn (description)
                  </label>
                  <textarea
                    rows={4}
                    value={newsForm.description}
                    onChange={(e) => setNewsForm({ ...newsForm, description: e.target.value })}
                    placeholder="Yangilik haqida batafsil ma'lumot..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 14px",
                      background: "rgba(30, 41, 59, 0.9)",
                      border: "1px solid rgba(148, 163, 184, 0.25)",
                      borderRadius: "10px",
                      color: "#f8fafc",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                    Majburiy Talab / Ogohlantirish (demand) <span style={{ color: "#94a3b8", fontSize: "12px" }}>(ixtiyoriy, kiritilmasa saytda ko'rinmaydi)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={newsForm.demand}
                    onChange={(e) => setNewsForm({ ...newsForm, demand: e.target.value })}
                    placeholder="Masalan: Tadbirda barcha o'quvchilar maktab formasida bo'lishi shart!"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 14px",
                      background: "rgba(30, 41, 59, 0.9)",
                      border: "1px solid rgba(249, 115, 22, 0.35)",
                      borderRadius: "10px",
                      color: "#f8fafc",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                      Sana (date)
                    </label>
                    <input
                      type="date"
                      value={newsForm.date}
                      onChange={(e) => setNewsForm({ ...newsForm, date: e.target.value })}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                      Muallif (author)
                    </label>
                    <input
                      type="text"
                      value={newsForm.author}
                      onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })}
                      placeholder="Masalan: Ma'naviyat bo'limi"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                </div>

                {/* Rasm tanlash (5 tagacha rasm: Qurilmadan yoki URL) */}
                <div style={{ marginTop: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>
                      Yangilik rasmlari <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "normal" }}>(1 tadan 5 tagacha yuklash mumkin)</span>
                    </label>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: (newsForm.images || []).length >= 5 ? "#f87171" : "#fb923c",
                        background: "rgba(249, 115, 22, 0.12)",
                        padding: "2px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      {(newsForm.images || []).length} / 5 rasm
                    </span>
                  </div>

                  {/* Yashirin fayl tanlash inputi (multiple) */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleImageFileChange}
                    style={{ display: "none" }}
                  />

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    {/* Fayl yuklash tugmasi */}
                    <button
                      type="button"
                      disabled={uploadingImage || (newsForm.images || []).length >= 5}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        background:
                          (newsForm.images || []).length >= 5
                            ? "rgba(100, 116, 139, 0.15)"
                            : "rgba(249, 115, 22, 0.15)",
                        border:
                          (newsForm.images || []).length >= 5
                            ? "1px solid rgba(148, 163, 184, 0.2)"
                            : "1px solid rgba(249, 115, 22, 0.4)",
                        borderRadius: "10px",
                        color: (newsForm.images || []).length >= 5 ? "#64748b" : "#fb923c",
                        fontSize: "13.5px",
                        fontWeight: "600",
                        cursor:
                          uploadingImage || (newsForm.images || []).length >= 5 ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s",
                      }}
                    >
                      <FiUpload size={16} />{" "}
                      {uploadingImage
                        ? "Yuklanmoqda..."
                        : (newsForm.images || []).length >= 5
                        ? "Chegara to'ldi (5/5)"
                        : "📁 Qurilmadan rasm tanlash"}
                    </button>

                    {/* URL inputi (Rasm tanlangan bo'lsa disable / qotgan) */}
                    <div style={{ flex: "1 1 250px", minWidth: "200px", display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        disabled={(newsForm.images || []).length > 0}
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddUrlImage();
                          }
                        }}
                        placeholder={
                          (newsForm.images || []).length > 0
                            ? "Rasm tanlangan (Havola kiritish o'chirilgan)"
                            : "yoki rasm havolasi (URL): https://..."
                        }
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px 14px",
                          background:
                            (newsForm.images || []).length > 0
                              ? "rgba(15, 23, 42, 0.6)"
                              : "rgba(30, 41, 59, 0.9)",
                          border:
                            (newsForm.images || []).length > 0
                              ? "1px solid rgba(148, 163, 184, 0.15)"
                              : "1px solid rgba(148, 163, 184, 0.25)",
                          borderRadius: "10px",
                          color: (newsForm.images || []).length > 0 ? "#64748b" : "#f8fafc",
                          fontSize: "13.5px",
                          cursor: (newsForm.images || []).length > 0 ? "not-allowed" : "text",
                          opacity: (newsForm.images || []).length > 0 ? 0.6 : 1,
                        }}
                      />
                      {!(newsForm.images || []).length && (
                        <button
                          type="button"
                          onClick={handleAddUrlImage}
                          style={{
                            padding: "10px 14px",
                            background: "rgba(249, 115, 22, 0.2)",
                            border: "1px solid rgba(249, 115, 22, 0.35)",
                            borderRadius: "10px",
                            color: "#fb923c",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rasmlar PREVIEW GRID (1 tadan 5 tagacha) */}
                  {(newsForm.images || []).length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                          gap: "10px",
                        }}
                      >
                        {(newsForm.images || []).map((imgSrc, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: "relative",
                              borderRadius: "10px",
                              overflow: "hidden",
                              border: "1px solid rgba(249, 115, 22, 0.35)",
                              background: "#0f172a",
                              height: "90px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                            }}
                          >
                            <img
                              src={imgSrc}
                              alt={`Preview ${idx + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                bottom: "4px",
                                left: "4px",
                                background: "rgba(0,0,0,0.75)",
                                color: "#fb923c",
                                fontSize: "10.5px",
                                fontWeight: "700",
                                padding: "1px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              title="Ushbu rasmni o'chirish"
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                width: "22px",
                                height: "22px",
                                borderRadius: "50%",
                                background: "rgba(239, 68, 68, 0.9)",
                                border: "none",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setIsNewsFormOpen(false)}
                    style={{
                      padding: "10px 18px",
                      background: "rgba(100, 116, 139, 0.2)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "10px",
                      color: "#cbd5e1",
                      cursor: "pointer",
                      fontSize: "13.5px",
                    }}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 22px",
                      background: "linear-gradient(135deg, #ea580c, #f97316)",
                      border: "none",
                      borderRadius: "10px",
                      color: "#ffffff",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "13.5px",
                      boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
                    }}
                  >
                    {editingNews ? "O'zgarishlarni saqlash" : "Yangilikni chop etish"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Yangiliklar ro'yxati */}
          {newsLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <HashLoader color="#f97316" size={40} />
            </div>
          ) : newsList.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "rgba(15, 23, 42, 0.5)",
                borderRadius: "18px",
                border: "1px dashed rgba(148, 163, 184, 0.2)",
                color: "#94a3b8",
              }}
            >
              Hozircha hech qanday yangilik mavjud emas. Yuqoridagi tugma orqali yangi qo'shing.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {newsList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(148, 163, 184, 0.15)",
                    borderRadius: "16px",
                    padding: "16px 20px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div style={{ flex: "1 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span
                        style={{
                          fontSize: "11.5px",
                          background: "rgba(249, 115, 22, 0.15)",
                          color: "#fb923c",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontWeight: "600",
                        }}
                      >
                        {item.date || item.sana || "Sana yo'q"}
                      </span>
                      {((item.images && item.images.length > 0) || item.image) && (
                        <span style={{ fontSize: "12px", color: "#fb923c", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          📷 {Array.isArray(item.images) && item.images.length > 1 ? `${item.images.length} ta rasm` : "1 ta rasm"}
                        </span>
                      )}
                      {item.author && (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                          ✍️ {item.author}
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "15.5px", color: "#f8fafc", fontWeight: "600" }}>
                      {item.title || item.sarlavha || "Sarlavhasiz"}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#94a3b8",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {item.description || item.tavsif || item.content || "Tavsif yo'q"}
                    </p>

                    {(item.demand || item.talab) && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "6px 10px",
                          background: "rgba(249, 115, 22, 0.12)",
                          borderLeft: "3px solid #f97316",
                          borderRadius: "4px 8px 8px 4px",
                          fontSize: "12px",
                          color: "#fdba74",
                          lineHeight: 1.4,
                        }}
                      >
                        ⚠️ <strong>Talab:</strong> {item.demand || item.talab}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleEditNewsClick(item)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        background: "rgba(59, 130, 246, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "10px",
                        color: "#60a5fa",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <FiEdit2 size={14} /> Tahrirlash
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNews(item.id, item.title || item.sarlavha || "")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "10px",
                        color: "#f87171",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <FiTrash2 size={14} /> O'chirish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAKTAB & HODIMLAR BOSHQARUVI TAB                      */}
      {/* ======================================================== */}
      {activeTab === "teachers" && (
        <div>
          {/* Statistika ko'rsatkichlari kartalari */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(249, 115, 22, 0.25)",
                borderRadius: "16px",
                padding: "16px 20px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Jami o'qituvchilar soni</span>
              <h3 style={{ fontSize: "24px", margin: "4px 0 0", color: "#fb923c" }}>
                {schoolData?.oqituvchilar_soni || 0} ta
              </h3>
            </div>

            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                borderRadius: "16px",
                padding: "16px 20px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Oliy toifali</span>
              <h3 style={{ fontSize: "24px", margin: "4px 0 0", color: "#60a5fa" }}>
                {schoolData?.toifalar?.oliy_toifali || 0} ta
              </h3>
            </div>

            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                borderRadius: "16px",
                padding: "16px 20px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>1-toifali</span>
              <h3 style={{ fontSize: "24px", margin: "4px 0 0", color: "#4ade80" }}>
                {schoolData?.toifalar?.bir_toifali || 0} ta
              </h3>
            </div>

            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(168, 85, 247, 0.25)",
                borderRadius: "16px",
                padding: "16px 20px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>2-toifali & Mutaxassis</span>
              <h3 style={{ fontSize: "24px", margin: "4px 0 0", color: "#c084fc" }}>
                {(schoolData?.toifalar?.ikki_toifali || 0) + (schoolData?.toifalar?.mutaxassis || 0)} ta
              </h3>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#f8fafc" }}>
                Hodimlar ro'yxati
              </h2>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                O'zgarishlar statistikani avtomatik yangilaydi
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTeacher(null);
                setEditingIndex(null);
                setTeacherForm({
                  f_i_sh: "",
                  lavozimi: "O'qituvchi",
                  fani: "",
                  malumoti: "oliy",
                  mutaxassisligi: "",
                  toifasi: "M",
                  asosiy_yoki_urindosh: "asosiy",
                });
                setIsTeacherFormOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                border: "none",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "13.5px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
              }}
            >
              <FiPlus size={16} /> Yangi xodim qo'shish
            </button>
          </div>

          {/* Xodim qo'shish / tahrirlash formasi */}
          {isTeacherFormOpen && (
            <div
              style={{
                background: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(249, 115, 22, 0.35)",
                borderRadius: "20px",
                padding: "24px",
                marginBottom: "24px",
                boxShadow: "0 14px 35px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", color: "#fb923c", fontWeight: "700" }}>
                  {editingTeacher ? "Xodim ma'lumotlarini tahrirlash" : "Yangi xodim qo'shish"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTeacherFormOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTeacher} style={{ display: "grid", gap: "14px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                      F.I.SH *
                    </label>
                    <input
                      type="text"
                      required
                      value={teacherForm.f_i_sh}
                      onChange={(e) => setTeacherForm({ ...teacherForm, f_i_sh: e.target.value })}
                      placeholder="Masalan: Karimov Alisher Valijonovich"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                      Lavozimi
                    </label>
                    <input
                      type="text"
                      value={teacherForm.lavozimi}
                      onChange={(e) => setTeacherForm({ ...teacherForm, lavozimi: e.target.value })}
                      placeholder="O'qituvchi / Direktor / O'IBDO'"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                      Fani
                    </label>
                    <input
                      type="text"
                      value={teacherForm.fani}
                      onChange={(e) => setTeacherForm({ ...teacherForm, fani: e.target.value })}
                      placeholder="Matematika / Ona tili / Tarix"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                      Ma'lumoti
                    </label>
                    <select
                      value={teacherForm.malumoti}
                      onChange={(e) => setTeacherForm({ ...teacherForm, malumoti: e.target.value })}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    >
                      <option value="oliy">Oliy</option>
                      <option value="o'rta maxsus">O'rta maxsus</option>
                      <option value="tugallanmagan oliy">Tugallanmagan oliy</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                      Mutaxassisligi
                    </label>
                    <input
                      type="text"
                      value={teacherForm.mutaxassisligi}
                      onChange={(e) => setTeacherForm({ ...teacherForm, mutaxassisligi: e.target.value })}
                      placeholder="Masalan: Boshlang'ich ta'lim"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                      Toifasi
                    </label>
                    <select
                      value={teacherForm.toifasi}
                      onChange={(e) => setTeacherForm({ ...teacherForm, toifasi: e.target.value })}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    >
                      <option value="Oliy">Oliy toifali</option>
                      <option value="1">1-toifali</option>
                      <option value="2">2-toifali</option>
                      <option value="M">Mutaxassis (M)</option>
                      <option value="orta_maxsus">O'rta maxsus</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setIsTeacherFormOpen(false)}
                    style={{
                      padding: "10px 18px",
                      background: "rgba(100, 116, 139, 0.2)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "10px",
                      color: "#cbd5e1",
                      cursor: "pointer",
                      fontSize: "13.5px",
                    }}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 22px",
                      background: "linear-gradient(135deg, #ea580c, #f97316)",
                      border: "none",
                      borderRadius: "10px",
                      color: "#ffffff",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "13.5px",
                      boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
                    }}
                  >
                    {editingTeacher ? "O'zgarishlarni saqlash" : "Xodimni qo'shish"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Xodimlar jadvali */}
          {teachersLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <HashLoader color="#f97316" size={40} />
            </div>
          ) : !schoolData?.hodimlar || schoolData.hodimlar.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "rgba(15, 23, 42, 0.5)",
                borderRadius: "18px",
                border: "1px dashed rgba(148, 163, 184, 0.2)",
                color: "#94a3b8",
              }}
            >
              Hozircha xodimlar mavjud emas. Yuqoridagi tugma orqali qo'shing yoki "node scripts/uploadData.js" ni ishga tushiring.
            </div>
          ) : (
            <div
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(148, 163, 184, 0.15)",
                borderRadius: "18px",
                overflowX: "auto",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "13.5px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "rgba(30, 41, 59, 0.8)",
                      borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "#94a3b8",
                      fontSize: "12.5px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <th style={{ padding: "14px 16px" }}>#</th>
                    <th style={{ padding: "14px 16px" }}>F.I.SH</th>
                    <th style={{ padding: "14px 16px" }}>Lavozimi</th>
                    <th style={{ padding: "14px 16px" }}>Fani</th>
                    <th style={{ padding: "14px 16px" }}>Ma'lumoti</th>
                    <th style={{ padding: "14px 16px" }}>Mutaxassisligi</th>
                    <th style={{ padding: "14px 16px" }}>Toifasi</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolData.hodimlar.map((teacher, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>{index + 1}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "600", color: "#f8fafc" }}>
                        {teacher.f_i_sh}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#cbd5e1" }}>
                        {teacher.lavozimi || "-"}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#cbd5e1" }}>
                        {teacher.fani || "-"}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#94a3b8" }}>
                        {teacher.malumoti || "-"}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#94a3b8" }}>
                        {teacher.mutaxassisligi || "-"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background:
                              teacher.toifasi === "Oliy"
                                ? "rgba(59, 130, 246, 0.2)"
                                : teacher.toifasi === "1"
                                ? "rgba(34, 197, 94, 0.2)"
                                : teacher.toifasi === "2"
                                ? "rgba(168, 85, 247, 0.2)"
                                : "rgba(100, 116, 139, 0.2)",
                            color:
                              teacher.toifasi === "Oliy"
                                ? "#60a5fa"
                                : teacher.toifasi === "1"
                                ? "#4ade80"
                                : teacher.toifasi === "2"
                                ? "#c084fc"
                                : "#cbd5e1",
                          }}
                        >
                          {teacher.toifasi || "M"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleEditTeacherClick(teacher, index)}
                            title="Tahrirlash"
                            style={{
                              padding: "6px 10px",
                              background: "rgba(59, 130, 246, 0.15)",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                              borderRadius: "8px",
                              color: "#60a5fa",
                              cursor: "pointer",
                            }}
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(index, teacher.f_i_sh)}
                            title="O'chirish"
                            style={{
                              padding: "6px 10px",
                              background: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: "8px",
                              color: "#f87171",
                              cursor: "pointer",
                            }}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
