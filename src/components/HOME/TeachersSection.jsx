import React, { useEffect, useState } from "react";
import { fetchSchoolFromFirestore } from "../../utils/firestoreService";
import "./TeachersSection.css";

const CACHE_TTL_MS = 1.5 * 24 * 60 * 60 * 1000; // 1.5 kun

export default function TeachersSection() {
  const [status, setStatus] = useState({
    oqituvchilar_soni: 78,
    oquvchilar_soni: 1240,
    toifalar: 26,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchTeachers = async () => {
      try {
        const result = await fetchSchoolFromFirestore({
          ttlMs: CACHE_TTL_MS,
        });

        if (isMounted && result?.data) {
          const data = result.data;
          const hodimlar = Array.isArray(data.hodimlar) ? data.hodimlar : [];

          const oqituvchilar =
            Number(data.oqituvchilar_soni) ||
            (hodimlar.length > 0 ? hodimlar.length : 78);

          const oquvchilar =
            Number(data.oquvchilar_soni) || 1240;

          let toifaVal = 26;
          if (data.toifalar && typeof data.toifalar === "object") {
            toifaVal = Number(data.toifalar.oliy_toifali) || 26;
          } else if (typeof data.toifalar === "number") {
            toifaVal = data.toifalar;
          }

          setStatus({
            oqituvchilar_soni: oqituvchilar,
            oquvchilar_soni: oquvchilar,
            toifalar: toifaVal,
          });
        }
      } catch (error) {
        console.warn("Ma'lumotlar bazasidan olishda ogohlantirish:", error);
      }
    };

    fetchTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="display" style={{ marginTop: 100 }}>
      <ul className="teachersListHome">
        <li>
          <h1 className="teacherTitle teacherTitleOne">
            {status.oqituvchilar_soni}
          </h1>
          <h2>Malakali pedagoglarimiz</h2>
          <p style={{ color: "#94a3b8" }}>
            Maktabimizdagi jami o'qituvchilar soni — {status.oqituvchilar_soni} ta
          </p>
        </li>
        <li className="teachersGlowCard">
          <h1 className="teacherTitle teacherTitleTwo">
            {status.oquvchilar_soni}
          </h1>
          <h2>Barcha g‘ayratli va ajoyib o‘quvchilar</h2>
          <p style={{ color: "#94a3b8" }}>
            Ta'lim olayotgan jami o'quvchilar soni — {status.oquvchilar_soni} ta
          </p>
        </li>
        <li>
          <h1 className="teacherTitle teacherTitleThree">
            {status.toifalar}
          </h1>
          <h2>O'qituvchilarimiz toifalari</h2>
          <p style={{ color: "#94a3b8" }}>
            Pedagoglarimizning oliy malaka toifalari soni — {status.toifalar} ta
          </p>
        </li>
      </ul>
    </section>
  );
}
