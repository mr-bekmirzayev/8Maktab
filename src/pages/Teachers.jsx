import React, { useEffect, useState, useMemo, useCallback } from "react";
import { HashLoader } from "react-spinners";
import {
  FaChalkboardTeacher,
  FaSearch,
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
  FaUsers,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import oneSectionBackground from "../assets/images/Home/oneSectionBackground.png";
import "./Teachers.css";

// ─── FAN IKONKALARI ─────────────────────────────────────────────────────────
const SUBJECT_ICONS = {
  "Tarix": <FaLandmark />,
  "Matematika": <FaCalculator />,
  "Fizika": <FaAtom />,
  "Informatika": <FaLaptopCode />,
  "Ingliz tili": <FaGlobe />,
  "Rus tili": <FaGlobe />,
  "O'zbek tili": <FaBookOpen />,
  "O'zbek tili va adabiyoti": <FaBookOpen />,
  "Kimyo": <FaFlask />,
  "Biologiya": <FaDna />,
  "Geografiya": <FaGlobe />,
  "Jismoniy tarbiya": <FaRunning />,
  "Tasviriy san'at": <FaPalette />,
  "Chizmachilik": <FaCompass />,
  "Texnologiya": <FaLaptopCode />,
  "Musiqa": <FaPalette />,
};

function getSubjectIcon(fani) {
  if (!fani) return <FaChalkboardTeacher />;
  const key = Object.keys(SUBJECT_ICONS).find((k) =>
    fani.toLowerCase().includes(k.toLowerCase())
  );
  return key ? SUBJECT_ICONS[key] : <FaChalkboardTeacher />;
}

// ─── TOIFA RANGI ────────────────────────────────────────────────────────────
function getToifaClass(toifa) {
  if (!toifa) return "toifa-default";
  const t = toifa.toLowerCase();
  if (t.includes("oliy")) return "toifa-oliy";
  if (t.includes("birinchi") || t.includes("1")) return "toifa-first";
  if (t.includes("ikkinchi") || t.includes("2")) return "toifa-second";
  return "toifa-default";
}

// ─── STATISTIKA KARTOCHKASI ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div className={`teachers-stat-card teachers-stat-card--${color}`}>
      <span className="teachers-stat-icon">{icon}</span>
      <div>
        <p className="teachers-stat-value">{value}</p>
        <p className="teachers-stat-label">{label}</p>
      </div>
    </div>
  );
}

// ─── ACCORDION (FAN BO'YI TABLE) ─────────────────────────────────────────────
function SubjectTable({ subject, teachers, viewMode, index }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="teachers-subject-group"
      style={{ "--group-index": index }}
    >
      {/* Sarlavha (accordion toggle) */}
      <button
        type="button"
        className="teachers-subject-header"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span className="teachers-subject-icon">{getSubjectIcon(subject)}</span>
        <span className="teachers-subject-name">{subject}</span>
        <span className="teachers-subject-count">{teachers.length} ta</span>
        <span className="teachers-subject-chevron">
          {open ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>

      {/* Content */}
      {open && (
        <div className="teachers-subject-body">
          {viewMode === "table" ? (
            <div className="teachers-table-wrap">
              <table className="teachers-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>F.I.Sh.</th>
                    <th>Lavozimi</th>
                    <th>Ma'lumoti</th>
                    <th>Mutaxassisligi</th>
                    <th>Toifasi</th>
                    <th>Turi</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t, i) => (
                    <tr key={t.t_r ?? i} className="teachers-table-row">
                      <td className="teachers-td-num">{t.t_r ?? i + 1}</td>
                      <td className="teachers-td-name">{t.f_i_sh || "—"}</td>
                      <td>{t.lavozimi || "—"}</td>
                      <td>{t.malumoti || "—"}</td>
                      <td>{t.mutaxassisligi || "—"}</td>
                      <td>
                        <span
                          className={`teachers-badge ${getToifaClass(t.toifasi)}`}
                        >
                          {t.toifasi || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`teachers-type-badge ${
                            t.asosiy_yoki_urindosh === "Asosiy"
                              ? "type-asosiy"
                              : "type-urindosh"
                          }`}
                        >
                          {t.asosiy_yoki_urindosh || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARD VIEW */
            <div className="teachers-cards-grid">
              {teachers.map((t, i) => (
                <div key={t.t_r ?? i} className="teachers-card">
                  <div className="teachers-card-avatar">
                    <FaGraduationCap />
                  </div>
                  <div className="teachers-card-body">
                    <p className="teachers-card-name">{t.f_i_sh || "—"}</p>
                    <p className="teachers-card-pos">{t.lavozimi || "—"}</p>
                    <p className="teachers-card-spec">
                      {t.mutaxassisligi || "—"}
                    </p>
                    <div className="teachers-card-badges">
                      <span
                        className={`teachers-badge ${getToifaClass(t.toifasi)}`}
                      >
                        {t.toifasi || "—"}
                      </span>
                      <span
                        className={`teachers-type-badge ${
                          t.asosiy_yoki_urindosh === "Asosiy"
                            ? "type-asosiy"
                            : "type-urindosh"
                        }`}
                      >
                        {t.asosiy_yoki_urindosh || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ASOSIY KOMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toifaFilter, setToifaFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [refreshing, setRefreshing] = useState(false);

  // ─── Firebase real-time listener ───────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    const docRef = doc(db, "schools", "school_8");

    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          setError("Ma'lumot topilmadi (schools/school_8).");
          setLoading(false);
          return;
        }
        const data = snap.data();
        const hodimlar = Array.isArray(data?.hodimlar) ? data.hodimlar : [];
        setTeachers(hodimlar);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Firestore xatosi:", err);
        setError("Firebase bilan aloqa yo'q. Internet aloqasini tekshiring.");
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsub();
  }, []);

  // ─── Qo'lda yangilash (refresh) ────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // onSnapshot avtomatik yangilanadi — faqat spinner effekti uchun
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  // ─── Filterlash ─────────────────────────────────────────────────────────────
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return teachers.filter((t) => {
      const matchSearch =
        !q ||
        (t.f_i_sh || "").toLowerCase().includes(q) ||
        (t.fani || "").toLowerCase().includes(q) ||
        (t.lavozimi || "").toLowerCase().includes(q) ||
        (t.mutaxassisligi || "").toLowerCase().includes(q);

      const matchToifa =
        toifaFilter === "all" ||
        (t.toifasi || "").toLowerCase() === toifaFilter.toLowerCase();

      return matchSearch && matchToifa;
    });
  }, [teachers, searchQuery, toifaFilter]);

  // ─── Fanga guruhlash ───────────────────────────────────────────────────────
  const groupedBySubject = useMemo(() => {
    const map = {};
    filteredTeachers.forEach((t) => {
      const fani = t.fani?.trim() || "Boshqa";
      if (!map[fani]) map[fani] = [];
      map[fani].push(t);
    });
    // Har bir guruh ichida t_r bo'yicha sort
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (a.t_r ?? 0) - (b.t_r ?? 0))
    );
    return map;
  }, [filteredTeachers]);

  // ─── Statistika ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = teachers.length;
    const oliy = teachers.filter((t) =>
      (t.toifasi || "").toLowerCase().includes("oliy")
    ).length;
    const asosiy = teachers.filter(
      (t) => t.asosiy_yoki_urindosh === "Asosiy"
    ).length;
    const subjects = new Set(teachers.map((t) => t.fani?.trim()).filter(Boolean)).size;
    return { total, oliy, asosiy, subjects };
  }, [teachers]);

  // ─── Toifa ro'yxati filter uchun ──────────────────────────────────────────
  const toifaOptions = useMemo(() => {
    const set = new Set(
      teachers.map((t) => t.toifasi?.trim()).filter(Boolean)
    );
    return ["all", ...Array.from(set).sort()];
  }, [teachers]);

  // ─── Chop etish ───────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="teachers-loading-screen">
        <HashLoader color="#f97316" size={56} />
        <p className="teachers-loading-text">
          Ustozlar ma'lumoti yuklanmoqda…
        </p>
      </div>
    );
  }

  // ─── XATO ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="teachers-error-screen">
        <FaChalkboardTeacher className="teachers-error-icon" />
        <h2>Xatolik yuz berdi</h2>
        <p>{error}</p>
        <button
          type="button"
          className="teachers-retry-btn"
          onClick={() => window.location.reload()}
        >
          <FaSyncAlt /> Qayta urinish
        </button>
      </div>
    );
  }

  // ─── BO'SH HOLAT ──────────────────────────────────────────────────────────
  if (teachers.length === 0) {
    return (
      <div className="teachers-empty-screen">
        <FaUsers className="teachers-empty-icon" />
        <h2>Ustozlar ma'lumoti hali kiritilmagan</h2>
        <p>Ma'lumotlar tizimga kiritilgach, bu yerda ko'rsatiladi.</p>
      </div>
    );
  }

  const subjectKeys = Object.keys(groupedBySubject);

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="teachers-page">
      {/* HERO */}
      <section
        className="teachers-hero"
        style={{ backgroundImage: `url(${oneSectionBackground})` }}
      >
        <div className="teachers-hero-overlay" />
        <div className="teachers-hero-content">
          <span className="teachers-hero-badge">Pedagogik jamoa</span>
          <h1 className="teachers-hero-title">
            Bizning <span>Ustozlarimiz</span>
          </h1>
          <p className="teachers-hero-desc">
            8-maktabning malakali va fidoyi pedagoglari — har bir shogirdning
            kelajagi shu insonlarga bog'liq.
          </p>
        </div>
      </section>

      {/* STATISTIKA */}
      <section className="teachers-stats-section display">
        <StatCard
          icon={<FaUsers />}
          label="Jami ustozlar"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<FaAward />}
          label="Oliy toifali"
          value={stats.oliy}
          color="orange"
        />
        <StatCard
          icon={<FaChalkboardTeacher />}
          label="Asosiy o'qituvchi"
          value={stats.asosiy}
          color="green"
        />
        <StatCard
          icon={<FaBookOpen />}
          label="Fan yo'nalishlari"
          value={stats.subjects}
          color="purple"
        />
      </section>

      {/* FILTER PANELI */}
      <section className="teachers-filter-section display">
        {/* Qidiruv */}
        <div className="teachers-search-wrap">
          <FaSearch className="teachers-search-icon" />
          <input
            type="text"
            className="teachers-search-input"
            placeholder="Ism, fan, mutaxassislik bo'yicha qidirish…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="teachers-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Tozalash"
            >
              ✕
            </button>
          )}
        </div>

        <div className="teachers-filter-right">
          {/* Toifa filter */}
          <select
            className="teachers-toifa-select"
            value={toifaFilter}
            onChange={(e) => setToifaFilter(e.target.value)}
          >
            <option value="all">Barcha toifalar</option>
            {toifaOptions
              .filter((t) => t !== "all")
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>

          {/* Ko'rinish */}
          <div className="teachers-view-toggle">
            <button
              type="button"
              className={`teachers-view-btn ${
                viewMode === "table" ? "active" : ""
              }`}
              onClick={() => setViewMode("table")}
              title="Jadval ko'rinishi"
            >
              <FaTable />
            </button>
            <button
              type="button"
              className={`teachers-view-btn ${
                viewMode === "card" ? "active" : ""
              }`}
              onClick={() => setViewMode("card")}
              title="Kartochka ko'rinishi"
            >
              <FaThLarge />
            </button>
          </div>

          {/* Chop et */}
          <button
            type="button"
            className="teachers-action-btn"
            onClick={handlePrint}
            title="Chop etish"
          >
            <FaPrint />
          </button>

          {/* Yangilash */}
          <button
            type="button"
            className={`teachers-action-btn ${refreshing ? "refreshing" : ""}`}
            onClick={handleRefresh}
            title="Yangilash"
            disabled={refreshing}
          >
            <FaSyncAlt />
          </button>
        </div>
      </section>

      {/* NATIJALAR QATORI */}
      <div className="teachers-results-info display">
        <p>
          <strong>{filteredTeachers.length}</strong> ta ustoz,{" "}
          <strong>{subjectKeys.length}</strong> ta fan bo'yicha
          {searchQuery && (
            <span>
              {" "}
              — "<em>{searchQuery}</em>" qidiruvida
            </span>
          )}
        </p>
      </div>

      {/* FANLAR BO'YICHA JADVALLAR */}
      <section className="teachers-groups-section display">
        {subjectKeys.length === 0 ? (
          <div className="teachers-no-results">
            <p>Qidiruv natijasi topilmadi.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setToifaFilter("all");
              }}
            >
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          subjectKeys.map((subject, i) => (
            <SubjectTable
              key={subject}
              subject={subject}
              teachers={groupedBySubject[subject]}
              viewMode={viewMode}
              index={i}
            />
          ))
        )}
      </section>
    </div>
  );
}
