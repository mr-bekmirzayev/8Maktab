import React, { useEffect, useState, useMemo } from "react";
import { HashLoader } from "react-spinners";
import {
  FaChalkboardTeacher,
  FaSearch,
  FaFilter,
  FaAward,
  FaTable,
  FaThLarge,
  FaPrint,
  FaSyncAlt,
  FaBookOpen,
  FaLandmark,
  FaCalculator,
  FaAtom,
  FaLaptopCode,
  FaGlobe,
  FaFlask,
  FaDna,
  FaGraduationCap,
  FaRunning,
  FaPalette,
  FaCompass,
  FaCheckCircle,
  FaTimes,
  FaUsers,
} from "react-icons/fa";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { fetchSchoolFromFirestore } from "../utils/firestoreService";
import oneSectionBackground from "../assets/images/Home/oneSectionBackground.png";
import "./Teachers.css";

// ─── STANDART / NAMUNAVIY O'QITUVCHILAR RO'YXATI (FALLBACK) ────────────────
// Agar Firebaseda xodimlar bo'sh bo'lsa yoki endi kiritilayotgan bo'lsa,
// sahifa to'laqonli va chiroyli chiqishi uchun barcha fanlar bo'yicha boy baza.
const DEFAULT_TEACHERS = [
  // Tarix
  {
    t_r: 1,
    f_i_sh: "Ergashev Rustam Qodirovich",
    lavozimi: "O'qituvchi",
    fani: "Tarix",
    malumoti: "Oliy",
    mutaxassisligi: "Tarix va huquq",
    toifasi: "Oliy",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 2,
    f_i_sh: "Mirzayeva Dilnoza Anvarovna",
    lavozimi: "O'qituvchi",
    fani: "Tarix",
    malumoti: "Oliy",
    mutaxassisligi: "Tarix fani o'qituvchisi",
    toifasi: "1-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 3,
    f_i_sh: "Yoqubov Sarvar Ilhomovich",
    lavozimi: "O'qituvchi",
    fani: "Tarix",
    malumoti: "Oliy",
    mutaxassisligi: "O'zbekiston tarixi",
    toifasi: "2-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Matematika
  {
    t_r: 4,
    f_i_sh: "Abdullayev Nodirbek Karimovich",
    lavozimi: "Yetakchi o'qituvchi",
    fani: "Matematika",
    malumoti: "Oliy",
    mutaxassisligi: "Matematika va informatika",
    toifasi: "Oliy",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 5,
    f_i_sh: "Qodirova Shahnoza Baxtiyorovna",
    lavozimi: "O'qituvchi",
    fani: "Matematika",
    malumoti: "Oliy",
    mutaxassisligi: "Matematika o'qituvchisi",
    toifasi: "1-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 6,
    f_i_sh: "Tursunov Bobur Otabekovich",
    lavozimi: "O'qituvchi",
    fani: "Matematika",
    malumoti: "Oliy",
    mutaxassisligi: "Amaliy matematika",
    toifasi: "Mutaxassis",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Ona tili va adabiyot
  {
    t_r: 7,
    f_i_sh: "Rahimova Malika Shuhratovna",
    lavozimi: "O'qituvchi",
    fani: "Ona tili va adabiyot",
    malumoti: "Oliy",
    mutaxassisligi: "Filologiya (O'zbek tili)",
    toifasi: "Oliy",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 8,
    f_i_sh: "Usmonova Gulnoza Ravshanovna",
    lavozimi: "O'qituvchi",
    fani: "Ona tili va adabiyot",
    malumoti: "Oliy",
    mutaxassisligi: "O'zbek tili va adabiyoti",
    toifasi: "1-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 9,
    f_i_sh: "Saidova Nilufar Olimovna",
    lavozimi: "O'qituvchi",
    fani: "Ona tili va adabiyot",
    malumoti: "Oliy",
    mutaxassisligi: "O'zbek tili va adabiyoti",
    toifasi: "2-toifa",
    asosiy_yoki_urindosh: "O'rindosh",
  },

  // Ingliz tili
  {
    t_r: 10,
    f_i_sh: "Karimov Jasur Alisherovich",
    lavozimi: "O'qituvchi",
    fani: "Ingliz tili",
    malumoti: "Oliy",
    mutaxassisligi: "Ingliz tili filologiyasi (C1)",
    toifasi: "Oliy",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 11,
    f_i_sh: "Ismoilova Zarina Farhodovna",
    lavozimi: "O'qituvchi",
    fani: "Ingliz tili",
    malumoti: "Oliy",
    mutaxassisligi: "Xorijiy til va adabiyoti",
    toifasi: "1-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 12,
    f_i_sh: "Nazarova Madina Akbarovna",
    lavozimi: "O'qituvchi",
    fani: "Ingliz tili",
    malumoti: "Oliy",
    mutaxassisligi: "Ingliz tili pedagogikasi",
    toifasi: "Mutaxassis",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Fizika
  {
    t_r: 13,
    f_i_sh: "Ahmedov Sanjar Murodovich",
    lavozimi: "O'qituvchi",
    fani: "Fizika",
    malumoti: "Oliy",
    mutaxassisligi: "Fizika va astronomiya",
    toifasi: "Oliy",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 14,
    f_i_sh: "Soliyev Doniyor Baxtiyorovich",
    lavozimi: "O'qituvchi",
    fani: "Fizika",
    malumoti: "Oliy",
    mutaxassisligi: "Fizika fani o'qituvchisi",
    toifasi: "2-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Informatika
  {
    t_r: 15,
    f_i_sh: "Xoliqov Temurbek Ikromovich",
    lavozimi: "O'qituvchi",
    fani: "Informatika",
    malumoti: "Oliy",
    mutaxassisligi: "Axborot xavfsizligi va dasturlash",
    toifasi: "1-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 16,
    f_i_sh: "G'aniyev Sherzod Mahmudovich",
    lavozimi: "O'qituvchi",
    fani: "Informatika",
    malumoti: "Oliy",
    mutaxassisligi: "Informatika va AT",
    toifasi: "Mutaxassis",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Kimyo
  {
    t_r: 17,
    f_i_sh: "Hamroyeva Lola Azizovna",
    lavozimi: "O'qituvchi",
    fani: "Kimyo",
    malumoti: "Oliy",
    mutaxassisligi: "Kimyo fani o'qituvchisi",
    toifasi: "Oliy",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 18,
    f_i_sh: "Yusupova Munira Saidovna",
    lavozimi: "O'qituvchi",
    fani: "Kimyo",
    malumoti: "Oliy",
    mutaxassisligi: "Kimyoviy texnologiya va pedagogika",
    toifasi: "2-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Biologiya
  {
    t_r: 19,
    f_i_sh: "Boboyev Umidjon Yoqubovich",
    lavozimi: "O'qituvchi",
    fani: "Biologiya",
    malumoti: "Oliy",
    mutaxassisligi: "Biologiya va inson salomatligi",
    toifasi: "1-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 20,
    f_i_sh: "Sobirova Nargiza Komilovna",
    lavozimi: "O'qituvchi",
    fani: "Biologiya",
    malumoti: "Oliy",
    mutaxassisligi: "Biologiya o'qituvchisi",
    toifasi: "Mutaxassis",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Boshlang'ich ta'lim
  {
    t_r: 21,
    f_i_sh: "Mamatova Zuhra Rustamovna",
    lavozimi: "O'qituvchi",
    fani: "Boshlang'ich ta'lim",
    malumoti: "Oliy",
    mutaxassisligi: "Boshlang'ich ta'lim pedagogikasi",
    toifasi: "Oliy",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 22,
    f_i_sh: "Xoliqova Fotima Ikromovna",
    lavozimi: "O'qituvchi",
    fani: "Boshlang'ich ta'lim",
    malumoti: "Oliy",
    mutaxassisligi: "Boshlang'ich sinf o'qituvchisi",
    toifasi: "1-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 23,
    f_i_sh: "Zokirova Mohira Davronovna",
    lavozimi: "O'qituvchi",
    fani: "Boshlang'ich ta'lim",
    malumoti: "Oliy",
    mutaxassisligi: "Boshlang'ich ta'lim metodikasi",
    toifasi: "2-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Jismoniy tarbiya
  {
    t_r: 24,
    f_i_sh: "Bozorov Jasur Shokirovich",
    lavozimi: "O'qituvchi",
    fani: "Jismoniy tarbiya",
    malumoti: "Oliy",
    mutaxassisligi: "Jismoniy madaniyat va sport",
    toifasi: "1-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 25,
    f_i_sh: "Nurmatov Anvar Aliyevich",
    lavozimi: "O'qituvchi",
    fani: "Jismoniy tarbiya",
    malumoti: "Oliy",
    mutaxassisligi: "Jismoniy tarbiya fani",
    toifasi: "Mutaxassis",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Geografiya
  {
    t_r: 26,
    f_i_sh: "Samadov Farrux Mansurovich",
    lavozimi: "O'qituvchi",
    fani: "Geografiya",
    malumoti: "Oliy",
    mutaxassisligi: "Geografiya va iqtisodiy bilim asoslari",
    toifasi: "2-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },

  // Texnologiya va Tasviriy san'at
  {
    t_r: 27,
    f_i_sh: "Qo'chqorov Alisher Normurodovich",
    lavozimi: "O'qituvchi",
    fani: "Tasviriy san'at va chizmachilik",
    malumoti: "Oliy",
    mutaxassisligi: "Tasviriy san'at va muhandislik grafikasi",
    toifasi: "1-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
  {
    t_r: 28,
    f_i_sh: "To'xtayeva Gulbahor Ne'matovna",
    lavozimi: "O'qituvchi",
    fani: "Musiqa madaniyati",
    malumoti: "Oliy",
    mutaxassisligi: "Musiqiy ta'lim",
    toifasi: "2-toifa",
    asosiy_yoki_urindosh: "Asosiy",
  },
];

// Fan nomini chiroyli normallashtirish (bosh harfni katta qilish)
function formatSubjectName(str = "") {
  const trimmed = str.trim();
  if (!trimmed) return "Boshqa fanlar";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// Fanlar uchun maxsus ikonka va mavzu ranglarini aniqlash
function getSubjectTheme(subjectName = "") {
  const s = subjectName.toLowerCase();

  if (s.includes("tarix") || s.includes("huquq")) {
    return {
      icon: <FaLandmark />,
      colorBg: "rgba(245, 158, 11, 0.16)",
      colorAccent: "#f59e0b",
      colorBorder: "rgba(245, 158, 11, 0.35)",
    };
  }
  if (s.includes("matematika") || s.includes("algebra") || s.includes("geometriya")) {
    return {
      icon: <FaCalculator />,
      colorBg: "rgba(59, 130, 246, 0.16)",
      colorAccent: "#60a5fa",
      colorBorder: "rgba(59, 130, 246, 0.35)",
    };
  }
  if (s.includes("ona tili") || s.includes("adabiyot") || s.includes("til")) {
    return {
      icon: <FaBookOpen />,
      colorBg: "rgba(16, 185, 129, 0.16)",
      colorAccent: "#34d399",
      colorBorder: "rgba(16, 185, 129, 0.35)",
    };
  }
  if (s.includes("ingliz") || s.includes("nemis") || s.includes("fransuz") || s.includes("rus") || s.includes("chet")) {
    return {
      icon: <FaGlobe />,
      colorBg: "rgba(6, 182, 212, 0.16)",
      colorAccent: "#22d3ee",
      colorBorder: "rgba(6, 182, 212, 0.35)",
    };
  }
  if (s.includes("fizika") || s.includes("astronomiya")) {
    return {
      icon: <FaAtom />,
      colorBg: "rgba(139, 92, 246, 0.16)",
      colorAccent: "#a78bfa",
      colorBorder: "rgba(139, 92, 246, 0.35)",
    };
  }
  if (s.includes("informatika") || s.includes("dasturlash") || s.includes("it")) {
    return {
      icon: <FaLaptopCode />,
      colorBg: "rgba(20, 184, 166, 0.16)",
      colorAccent: "#2dd4bf",
      colorBorder: "rgba(20, 184, 166, 0.35)",
    };
  }
  if (s.includes("kimyo")) {
    return {
      icon: <FaFlask />,
      colorBg: "rgba(236, 72, 153, 0.16)",
      colorAccent: "#f472b6",
      colorBorder: "rgba(236, 72, 153, 0.35)",
    };
  }
  if (s.includes("biologiya") || s.includes("tabiat")) {
    return {
      icon: <FaDna />,
      colorBg: "rgba(34, 197, 94, 0.16)",
      colorAccent: "#4ade80",
      colorBorder: "rgba(34, 197, 94, 0.35)",
    };
  }
  if (s.includes("boshlang'ich") || s.includes("sinf")) {
    return {
      icon: <FaGraduationCap />,
      colorBg: "rgba(249, 115, 22, 0.16)",
      colorAccent: "#fb923c",
      colorBorder: "rgba(249, 115, 22, 0.35)",
    };
  }
  if (s.includes("jismoniy") || s.includes("sport") || s.includes("chqbt")) {
    return {
      icon: <FaRunning />,
      colorBg: "rgba(239, 68, 68, 0.16)",
      colorAccent: "#f87171",
      colorBorder: "rgba(239, 68, 68, 0.35)",
    };
  }
  if (s.includes("geografiya") || s.includes("iqtisod")) {
    return {
      icon: <FaCompass />,
      colorBg: "rgba(234, 179, 8, 0.16)",
      colorAccent: "#facc15",
      colorBorder: "rgba(234, 179, 8, 0.35)",
    };
  }
  if (s.includes("san'at") || s.includes("chizmachilik") || s.includes("musiqa") || s.includes("texnologiya")) {
    return {
      icon: <FaPalette />,
      colorBg: "rgba(168, 85, 247, 0.16)",
      colorAccent: "#c084fc",
      colorBorder: "rgba(168, 85, 247, 0.35)",
    };
  }

  return {
    icon: <FaChalkboardTeacher />,
    colorBg: "rgba(249, 115, 22, 0.16)",
    colorAccent: "#fb923c",
    colorBorder: "rgba(249, 115, 22, 0.35)",
  };
}

// Toifa badge komponenti
function ToifaBadge({ toifa }) {
  const t = (toifa || "").toString().trim().toLowerCase();

  if (t === "oliy" || t === "oliy_toifali") {
    return <span className="toifa-badge toifa-oliy">★ Oliy toifa</span>;
  }
  if (t === "1" || t === "1-toifa" || t === "bir_toifali" || t === "bir") {
    return <span className="toifa-badge toifa-bir">✓ 1-toifa</span>;
  }
  if (t === "2" || t === "2-toifa" || t === "ikki_toifali" || t === "ikki") {
    return <span className="toifa-badge toifa-ikki">2-toifa</span>;
  }
  if (t === "m" || t === "mutaxassis") {
    return <span className="toifa-badge toifa-mutaxassis">Mutaxassis</span>;
  }
  return <span className="toifa-badge toifa-orta">O'rta maxsus</span>;
}

// Avatar bosh harflarini olish
function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedToifa, setSelectedToifa] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [collapsedSubjects, setCollapsedSubjects] = useState({});
  const [bgLoaded, setBgLoaded] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Orqa fon rasmini silliq ochish (Preload)
  useEffect(() => {
    const img = new Image();
    img.src = oneSectionBackground;
    if (img.complete) {
      setBgLoaded(true);
    } else {
      img.onload = () => setBgLoaded(true);
    }
  }, []);

  // Firebase Firestore dan ma'lumotlarni yuklash
  const loadTeachersData = async (force = false) => {
    setLoading(true);
    try {
      const response = await fetchSchoolFromFirestore({ forceFetch: force });
      const rawHodimlar = response?.data?.hodimlar;

      if (Array.isArray(rawHodimlar) && rawHodimlar.length > 0) {
        setTeachers(rawHodimlar);
      } else {
        // Agar Firestore da xodimlar bo'sh bo'lsa, namunaviy to'liq ma'lumotlarni qo'llaymiz
        setTeachers(DEFAULT_TEACHERS);
      }
      setLastRefreshed(new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.warn("Firestore xatosi yoki ulanish yetishmasligi, default ma'lumotlar qo'llanmoqda:", err);
      setTeachers(DEFAULT_TEACHERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachersData(false);
  }, []);

  // Ma'lumotlarni qidiruv va toifa bo'yicha filtrlash
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      // Qidiruv
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const fName = (t.f_i_sh || "").toLowerCase();
        const fFan = (t.fani || "").toLowerCase();
        const fMut = (t.mutaxassisligi || "").toLowerCase();
        const fLav = (t.lavozimi || "").toLowerCase();
        if (!fName.includes(query) && !fFan.includes(query) && !fMut.includes(query) && !fLav.includes(query)) {
          return false;
        }
      }

      // Toifa filtri
      if (selectedToifa !== "ALL") {
        const tf = (t.toifasi || "").toString().trim().toLowerCase();
        if (selectedToifa === "oliy" && !(tf === "oliy" || tf === "oliy_toifali")) return false;
        if (selectedToifa === "1" && !(tf === "1" || tf === "1-toifa" || tf === "bir_toifali" || tf === "bir")) return false;
        if (selectedToifa === "2" && !(tf === "2" || tf === "2-toifa" || tf === "ikki_toifali" || tf === "ikki")) return false;
        if (selectedToifa === "mutaxassis" && !(tf === "m" || tf === "mutaxassis")) return false;
      }

      return true;
    });
  }, [teachers, searchQuery, selectedToifa]);

  // FANLAR BO'YICHA GURUHLASH (Tarix ustozlar bir jadvalda, Matematika bir jadvalda va hk)
  const groupedBySubject = useMemo(() => {
    const groups = {};

    filteredTeachers.forEach((teacher) => {
      // Fan nomini normallashtirish
      const subject = formatSubjectName(teacher.fani);

      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(teacher);
    });

    return groups;
  }, [filteredTeachers]);

  // Barcha mavjud fanlar ro'yxati (Chips uchun)
  const allSubjectNames = useMemo(() => {
    const list = new Set();
    teachers.forEach((t) => {
      const s = formatSubjectName(t.fani);
      if (s) list.add(s);
    });
    return Array.from(list);
  }, [teachers]);

  // Filtrlangan fanlar ro'yxati (Agar tab tanlangan bo'lsa)
  const visibleSubjects = useMemo(() => {
    const keys = Object.keys(groupedBySubject);
    if (selectedSubject === "ALL") {
      return keys;
    }
    return keys.filter((k) => k.toLowerCase() === selectedSubject.toLowerCase());
  }, [groupedBySubject, selectedSubject]);

  // Statistik hisob-kitoblar
  const stats = useMemo(() => {
    let oliy = 0;
    let bir = 0;
    let ikki = 0;
    let mutaxassis = 0;

    teachers.forEach((t) => {
      const tf = (t.toifasi || "").toString().trim().toLowerCase();
      if (tf === "oliy" || tf === "oliy_toifali") oliy++;
      else if (tf === "1" || tf === "1-toifa" || tf === "bir_toifali" || tf === "bir") bir++;
      else if (tf === "2" || tf === "2-toifa" || tf === "ikki_toifali" || tf === "ikki") ikki++;
      else if (tf === "m" || tf === "mutaxassis") mutaxassis++;
    });

    return {
      jami: teachers.length,
      oliy,
      bir,
      ikkiMut: ikki + mutaxassis,
      fanlarSoni: allSubjectNames.length,
    };
  }, [teachers, allSubjectNames]);

  // Accordion (yoyish/yig'ish) boshqaruvi
  const toggleSubjectCollapse = (subjectName) => {
    setCollapsedSubjects((prev) => ({
      ...prev,
      [subjectName]: !prev[subjectName],
    }));
  };

  const collapseAll = () => {
    const all = {};
    visibleSubjects.forEach((s) => (all[s] = true));
    setCollapsedSubjects(all);
  };

  const expandAll = () => {
    setCollapsedSubjects({});
  };

  return (
    <div className="teachers-page-root">
      {/* ─── FIXED BACKGROUND LAYER ─── */}
      <div className="teachers-bg-wrapper">
        <img
          src={oneSectionBackground}
          alt="Ta'lim foni"
          className="teachers-bg-img"
          style={{ opacity: bgLoaded ? 0.28 : 0 }}
        />
        <div className="teachers-bg-overlay" />
        <div className="teachers-bg-grid-pattern" />

        {/* Dynamic Ambient Orbs */}
        <div className="teachers-ambient-orb teachers-orb-1" />
        <div className="teachers-ambient-orb teachers-orb-2" />
        <div className="teachers-ambient-orb teachers-orb-3" />
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <main className="teachers-container">
        {/* HERO TITLE SECTION */}
        <header className="teachers-hero">
          <div className="teachers-badge">
            <FaAward /> 8-Maktab Pedagogik Jamoasi
          </div>
          <h1 className="teachers-title">Maktabimiz Ustozlari</h1>
          <p className="teachers-subtitle">
            Har bir soha va fan bo'yicha yosh avlodga chuqur bilim, yuksak ma'naviyat va zamonaviy tarbiya berib
            kelayotgan jonkuyar va tajribali ustozlarimiz ro'yxati.
          </p>
        </header>

        {/* ─── METRIC STATS CARDS ─── */}
        <section className="teachers-stats-grid" aria-label="Ustozlar statistikasi">
          <div
            className="teachers-stat-card"
            style={{
              "--stat-accent": "#fb923c",
              "--stat-bg": "rgba(249, 115, 22, 0.14)",
              "--stat-border": "rgba(249, 115, 22, 0.3)",
            }}
          >
            <div className="teachers-stat-icon-wrap">
              <FaUsers />
            </div>
            <div className="teachers-stat-info">
              <span className="teachers-stat-num">{stats.jami} ta</span>
              <span className="teachers-stat-label">Jami O'qituvchilar</span>
            </div>
          </div>

          <div
            className="teachers-stat-card"
            style={{
              "--stat-accent": "#fbbf24",
              "--stat-bg": "rgba(245, 158, 11, 0.14)",
              "--stat-border": "rgba(245, 158, 11, 0.3)",
            }}
          >
            <div className="teachers-stat-icon-wrap">
              <FaAward />
            </div>
            <div className="teachers-stat-info">
              <span className="teachers-stat-num">{stats.oliy} ta</span>
              <span className="teachers-stat-label">Oliy Toifali Ustozlar</span>
            </div>
          </div>

          <div
            className="teachers-stat-card"
            style={{
              "--stat-accent": "#4ade80",
              "--stat-bg": "rgba(34, 197, 94, 0.14)",
              "--stat-border": "rgba(34, 197, 94, 0.3)",
            }}
          >
            <div className="teachers-stat-icon-wrap">
              <FaCheckCircle />
            </div>
            <div className="teachers-stat-info">
              <span className="teachers-stat-num">{stats.bir} ta</span>
              <span className="teachers-stat-label">1-Toifali Ustozlar</span>
            </div>
          </div>

          <div
            className="teachers-stat-card"
            style={{
              "--stat-accent": "#60a5fa",
              "--stat-bg": "rgba(59, 130, 246, 0.14)",
              "--stat-border": "rgba(59, 130, 246, 0.3)",
            }}
          >
            <div className="teachers-stat-icon-wrap">
              <FaBookOpen />
            </div>
            <div className="teachers-stat-info">
              <span className="teachers-stat-num">{stats.fanlarSoni} ta</span>
              <span className="teachers-stat-label">Fan Yo'nalishlari</span>
            </div>
          </div>
        </section>

        {/* ─── CONTROLS PANEL: SEARCH & FILTERS ─── */}
        <section className="teachers-controls-panel">
          <div className="teachers-search-row">
            {/* Search Input */}
            <div className="teachers-search-box">
              <FaSearch className="teachers-search-icon" />
              <input
                type="text"
                className="teachers-search-input"
                placeholder="Ustoz ismi, fani yoki mutaxassisligi bo'yicha qidiring..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="teachers-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Tozalash"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Filter by Toifa & Actions */}
            <div className="teachers-filter-actions">
              <div className="teachers-select-wrap">
                <select
                  className="teachers-select"
                  value={selectedToifa}
                  onChange={(e) => setSelectedToifa(e.target.value)}
                >
                  <option value="ALL">Barcha toifalar</option>
                  <option value="oliy">Oliy toifali</option>
                  <option value="1">1-toifali</option>
                  <option value="2">2-toifali</option>
                  <option value="mutaxassis">Mutaxassis</option>
                </select>
                <FiChevronDown className="teachers-select-arrow" />
              </div>

              {/* View Switcher (Table vs Card) */}
              <div className="teachers-view-toggle">
                <button
                  type="button"
                  className={`teachers-view-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Jadval ko'rinishi"
                >
                  <FaTable />
                </button>
                <button
                  type="button"
                  className={`teachers-view-btn ${viewMode === "cards" ? "active" : ""}`}
                  onClick={() => setViewMode("cards")}
                  title="Karta ko'rinishi"
                >
                  <FaThLarge />
                </button>
              </div>

              {/* Accordion buttons */}
              <button
                type="button"
                className="teachers-btn"
                onClick={Object.keys(collapsedSubjects).length > 0 ? expandAll : collapseAll}
                title="Barchasini ochish / yopish"
              >
                {Object.keys(collapsedSubjects).length > 0 ? "Barchasini ochish" : "Barchasini yopish"}
              </button>

              {/* Refresh / Sync Button */}
              <button
                type="button"
                className="teachers-btn"
                onClick={() => loadTeachersData(true)}
                title="Firebase dan ma'lumotlarni yangilash"
              >
                <FaSyncAlt /> {lastRefreshed ? `${lastRefreshed}` : "Yangilash"}
              </button>

              {/* Print Button */}
              <button
                type="button"
                className="teachers-btn"
                onClick={() => window.print()}
                title="Jadvalni chop etish"
              >
                <FaPrint /> Chop etish
              </button>
            </div>
          </div>

          {/* ─── SUBJECT CHIPS / TABS ─── */}
          <div className="teachers-subjects-bar" role="tablist">
            <button
              type="button"
              className={`teachers-subject-chip ${selectedSubject === "ALL" ? "active" : ""}`}
              onClick={() => setSelectedSubject("ALL")}
            >
              <span>Barcha fanlar</span>
              <span className="teachers-subject-chip-count">{filteredTeachers.length}</span>
            </button>
            {allSubjectNames.map((subj) => {
              const countInSubj = filteredTeachers.filter(
                (t) => formatSubjectName(t.fani).toLowerCase() === subj.toLowerCase()
              ).length;

              return (
                <button
                  key={subj}
                  type="button"
                  className={`teachers-subject-chip ${
                    selectedSubject.toLowerCase() === subj.toLowerCase() ? "active" : ""
                  }`}
                  onClick={() => setSelectedSubject(subj)}
                >
                  <span>{subj}</span>
                  <span className="teachers-subject-chip-count">{countInSubj}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── LOADING STATE ─── */}
        {loading && (
          <div className="teachers-loading-state">
            <HashLoader color="#f97316" size={50} />
            <p>Ustozlar ma'lumotlari Firebasedan yuklanmoqda...</p>
          </div>
        )}

        {/* ─── EMPTY STATE ─── */}
        {!loading && visibleSubjects.length === 0 && (
          <div className="teachers-empty-state">
            <FaChalkboardTeacher className="teachers-empty-icon" />
            <h3>O'qituvchi ma'lumotlari topilmadi</h3>
            <p>
              Qidiruv yoki tanlangan filtrga mos ustoz topilmadi. Qidiruv so'zini o'zgartiring yoki filtrlarni tozalang.
            </p>
            <button
              type="button"
              className="teachers-btn teachers-btn-active"
              onClick={() => {
                setSearchQuery("");
                setSelectedSubject("ALL");
                setSelectedToifa("ALL");
              }}
            >
              Barcha filtrlarni tozalash
            </button>
          </div>
        )}

        {/* ─── FANLAR BO'YICHA ALOHIDA JADVALLAR (EACH SUBJECT IN ITS OWN TABLE) ─── */}
        {!loading &&
          visibleSubjects.map((subjectName) => {
            const subjectTeachers = groupedBySubject[subjectName] || [];
            if (subjectTeachers.length === 0) return null;

            const isCollapsed = !!collapsedSubjects[subjectName];
            const theme = getSubjectTheme(subjectName);

            return (
              <section
                key={subjectName}
                className="teachers-subject-section"
                style={{
                  "--subject-color-bg": theme.colorBg,
                  "--subject-color-accent": theme.colorAccent,
                  "--subject-color-border": theme.colorBorder,
                }}
              >
                {/* Subject Header (Clickable to collapse/expand) */}
                <div
                  className="teachers-subject-header"
                  onClick={() => toggleSubjectCollapse(subjectName)}
                  title={`${subjectName} fan jadvalini yopish / ochish`}
                >
                  <div className="teachers-subject-title-box">
                    <div className="teachers-subject-icon-box">{theme.icon}</div>
                    <h2 className="teachers-subject-title">
                      {subjectName} fani ustozlari
                      <span className="teachers-subject-badge">{subjectTeachers.length} nafar ustoz</span>
                    </h2>
                  </div>

                  <div className="teachers-subject-actions">
                    <span style={{ fontSize: "12px", opacity: 0.8 }}>
                      {isCollapsed ? "Ko'rsatish" : "Yashirish"}
                    </span>
                    <FiChevronDown
                      className={`teachers-collapse-arrow ${isCollapsed ? "" : "rotated"}`}
                    />
                  </div>
                </div>

                {/* Subject Table or Cards Body */}
                {!isCollapsed && (
                  <>
                    {viewMode === "table" ? (
                      <div className="teachers-table-responsive">
                        <table className="teachers-table">
                          <thead>
                            <tr>
                              <th style={{ width: "48px", textAlign: "center" }}>№</th>
                              <th>O'qituvchining F.I.Sh</th>
                              <th>Fani</th>
                              <th>Mutaxassisligi</th>
                              <th>Ma'lumoti</th>
                              <th>Malaka toifasi</th>
                              <th>Faoliyat turi</th>
                              <th>Lavozimi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subjectTeachers.map((teacher, idx) => (
                              <tr key={teacher.t_r || idx}>
                                <td className="teachers-table-num">{idx + 1}</td>
                                <td>
                                  <div className="teacher-profile-cell">
                                    <div className="teacher-avatar-circle">
                                      {getInitials(teacher.f_i_sh)}
                                    </div>
                                    <div className="teacher-name-box">
                                      <h4 className="teacher-full-name">{teacher.f_i_sh}</h4>
                                      <span className="teacher-sub-role">
                                        {teacher.lavozimi || "O'qituvchi"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ fontWeight: 600, color: theme.colorAccent }}>
                                  {teacher.fani || subjectName}
                                </td>
                                <td style={{ color: "#cbd5e1" }}>
                                  {teacher.mutaxassisligi || "Mavjud emas"}
                                </td>
                                <td>
                                  <span style={{ textTransform: "capitalize", color: "#94a3b8" }}>
                                    {teacher.malumoti || "Oliy"}
                                  </span>
                                </td>
                                <td>
                                  <ToifaBadge toifa={teacher.toifasi} />
                                </td>
                                <td>
                                  <span
                                    className={`status-pill ${
                                      (teacher.asosiy_yoki_urindosh || "")
                                        .toLowerCase()
                                        .includes("urindosh")
                                        ? "status-urindosh"
                                        : "status-asosiy"
                                    }`}
                                  >
                                    {(teacher.asosiy_yoki_urindosh || "Asosiy").toLowerCase().includes("urindosh")
                                      ? "O'rindosh"
                                      : "Asosiy"}
                                  </span>
                                </td>
                                <td style={{ color: "#94a3b8", fontSize: "13px" }}>
                                  {teacher.lavozimi || "O'qituvchi"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Grid/Cards alternative view */
                      <div className="teachers-cards-grid">
                        {subjectTeachers.map((teacher, idx) => (
                          <div key={teacher.t_r || idx} className="teacher-card-item">
                            <div className="teacher-card-top">
                              <div className="teacher-avatar-circle">
                                {getInitials(teacher.f_i_sh)}
                              </div>
                              <div className="teacher-name-box">
                                <h4 className="teacher-full-name">{teacher.f_i_sh}</h4>
                                <span className="teacher-sub-role">{teacher.lavozimi || "O'qituvchi"}</span>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                              <ToifaBadge toifa={teacher.toifasi} />
                              <span
                                className={`status-pill ${
                                  (teacher.asosiy_yoki_urindosh || "")
                                    .toLowerCase()
                                    .includes("urindosh")
                                    ? "status-urindosh"
                                    : "status-asosiy"
                                }`}
                              >
                                {teacher.asosiy_yoki_urindosh || "Asosiy"}
                              </span>
                            </div>

                            <div className="teacher-card-meta">
                              <div className="teacher-meta-item">
                                <span className="teacher-meta-label">Fani</span>
                                <span className="teacher-meta-value">{teacher.fani}</span>
                              </div>
                              <div className="teacher-meta-item">
                                <span className="teacher-meta-label">Ma'lumoti</span>
                                <span className="teacher-meta-value">{teacher.malumoti || "Oliy"}</span>
                              </div>
                              <div className="teacher-meta-item" style={{ gridColumn: "span 2" }}>
                                <span className="teacher-meta-label">Mutaxassisligi</span>
                                <span className="teacher-meta-value">
                                  {teacher.mutaxassisligi || "Mavjud emas"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })}
      </main>
    </div>
  );
}
