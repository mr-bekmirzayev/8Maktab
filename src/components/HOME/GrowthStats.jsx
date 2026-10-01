import React from "react";
import { FaGraduationCap, FaUsers } from "react-icons/fa6";
import { TbChalkboardTeacher } from "react-icons/tb";

export default function GrowthStats() {
  return (
    <section className="griwthSection display">
      <h1 className="growthTitle">
        So'nggi 1-2 yil ichida jamoamizga qo'shilgan
        <br />
        o'quvchi va o'qituvchilar
      </h1>

      <ul className="growthList">
        <li className="growthCard growthCardLeft">
          <div className="growthCardIconWrap">
            <FaUsers className="growthCardIcon" />
          </div>
          <h2>+55</h2>
          <p>
            Bizning ochiq-ko'ngil ustozlar safiga qo'shilgan yangi ustozlarimiz
          </p>
        </li>

        <li className="growthCard growthCardCenter">
          <div className="growthCardIconWrap">
            <FaGraduationCap className="growthCardIcon" />
          </div>
          <h2>+185</h2>
          <p>
            Bilimga chanqoq va yuqori natijalarni qayd etayotgan yangi
            o'quvchilarimiz
          </p>
        </li>

        <li className="growthCard growthCardRight">
          <div className="growthCardIconWrap">
            <TbChalkboardTeacher className="growthCardIcon" />
          </div>
          <h2>+3</h2>
          <p>
            2026-yilda muvaffaqiyatli bitirib, katta hayotga qadam qo'ygan
            bitiruvchi sinflar
          </p>
        </li>
      </ul>
    </section>
  );
}
