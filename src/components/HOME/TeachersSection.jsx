import React, { useEffect, useState } from "react";
import { FaChalkboardTeacher } from "react-icons/fa";
import { VscChatSparkleError } from "react-icons/vsc";
import { HashLoader } from "react-spinners";
import { fetchWithJsonbinCache } from "../../utils/jsonbinCache";

const BIN_ID = "6aae18d1ac6210605adec643";
const MASTER_KEY = "$2a$10$P2EP5iL5TTjPvxXdGmgRJeZ0SuAQRZpwWmOWJV5dLBWuS791xj2jm";
const CACHE_KEY = "teachers-section-cache";
const CACHE_TTL_MS = 1.5 * 24 * 60 * 60 * 1000;

export default function TeachersSection() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTeachers = async () => {
      try {
        const result = await fetchWithJsonbinCache({
          binId: BIN_ID,
          masterKey: MASTER_KEY,
          cacheKey: CACHE_KEY,
          ttlMs: CACHE_TTL_MS,
        });

        if (isMounted) {
          setStatus(result?.data || null);
          setLoading(false);
        }
      } catch (error) {
        console.log("Ma'lumot olishda xatolik:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <h1 className="display" style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 16, color: "#f8fafc" }}>
        Yuklanmoqda <HashLoader color="#f97316" size={36} />
      </h1>
    );
  }

  if (!status) {
    return (
      <h1 className="display" style={{ marginTop: 40 }}>
        <VscChatSparkleError /> <span color="grey">Nimadur buzulib qoldi</span>
      </h1>
    );
  }

  const toifalarLength =
    typeof status?.toifalar === "object" && status.toifalar !== null
      ? Object.keys(status.toifalar).length
      : Array.isArray(status?.toifalar)
        ? status.toifalar.length
        : Number(status?.toifalar ?? 0) || 0;

  return (
    <section className="display" style={{ marginTop: 100 }}>
      <ul className="teachersListHome">
        <li>
          <h1 className="teacherTitle teacherTitleOne">
            {status.oqituvchilar_soni}
          </h1>
          <h2>Malakali pedagoglarimiz</h2>
          <p color="grey">Maktabimizdagi jami o'qituvchilar soni - {status.oqituvchilar_soni} ta</p>
        </li>
        <li className="teachersGlowCard">
          <h1 className="teacherTitle teacherTitleTwo">
            {status.oquvchilar_soni}
          </h1>
          <h2>Barcha g‘ayratli va ajoyib o‘quvchilar</h2>
          <p color="grey">Ta'lim olayotgan jami o'quvchilar soni - {status.oquvchilar_soni} ta</p>
        </li>
        <li>
          <h1 className="teacherTitle teacherTitleThree">{toifalarLength}</h1>
          <h2>O'qituvchilarimiz toifalari</h2>
          <p color="grey">Pedagoglarimizning malaka toifalari soni - {toifalarLength} ta</p>
        </li>
      </ul>
    </section>
  );
}
