import React from "react";
import { Link } from "react-router-dom";
import {
  FaShieldHalved,
  FaHandshake,
  FaQuoteLeft,
  FaArrowRight,
  FaUsers,
  FaRegNewspaper,
} from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import "./SchoolCharter.css";

export default function SchoolCharter() {
  return (
    <section className="school-charter-section">
      <div className="school-charter-container">
        {/* Shior Karti (School Motto Banner) */}
        <div className="charter-motto-card">
          <div className="motto-glow" />
          <FaQuoteLeft className="motto-quote-icon" />
          <h2 className="motto-title">
            "Ilm — saodat kaliti, odob — insoniyat ko'rki!"
          </h2>
          <p className="motto-sub">
            8-Maktab jamoasi har bir o'quvchini barkamol shaxs, komil inson va
            jamiyatga naf keltiruvchi yetuk mutaxassis qilib tarbiyalashni oliy maqsad deb biladi.
          </p>
        </div>

        {/* 2 Ustunli Qoidalar va Hamkorlik */}
        <div className="charter-columns">
          {/* 1. O'quvchi va Maktab Kodeksi */}
          <div className="charter-box">
            <div className="charter-box-header">
              <div className="charter-box-icon">
                <FaShieldHalved />
              </div>
              <div>
                <span className="charter-box-tag">Tartib va qoidalar</span>
                <h3 className="charter-box-title">O'quvchilar Odob Kodeksi</h3>
              </div>
            </div>
            <ul className="charter-list">
              <li>
                <span className="charter-bullet">01</span>
                <div>
                  <strong>Ustozlarga va tengdoshlarga yuksak hurmat:</strong>
                  <p>Maktabda doimo do'stona, samimiy va madaniyatli muomala muhiti ustuvor.</p>
                </div>
              </li>
              <li>
                <span className="charter-bullet">02</span>
                <div>
                  <strong>Dars intizomi va faol ishtirok:</strong>
                  <p>Har bir darsga o'z vaqtida, tayyorgarlik bilan kelish va ijodiy izlanish.</p>
                </div>
              </li>
              <li>
                <span className="charter-bullet">03</span>
                <div>
                  <strong>Maktab mulki va tabiatni asrash:</strong>
                  <p>Kitoblar, laboratoriya vositalari va yashil tabiatni ko'z qorachig'idek asrash.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* 2. Ota-onalar bilan Hamkorlik & Aloqa */}
          <div className="charter-box">
            <div className="charter-box-header">
              <div className="charter-box-icon icon-partnership">
                <FaHandshake />
              </div>
              <div>
                <span className="charter-box-tag">Oila va maktab birligi</span>
                <h3 className="charter-box-title">Ota-Onlar bilan Hamkorlik</h3>
              </div>
            </div>
            <p className="charter-partnership-desc">
              Farzand kamoli — ota-ona va maktabning mushtarak hamkorligida mustahkamlanadi.
              Biz ota-onalar bilan ochiq muloqot, oylik uchrashuvlar va individual
              pedagogik suhbatlar orqali har bir bolaga alohida mehr bilan yondashamiz.
            </p>

            <div className="charter-cta-box">
              <h4 className="charter-cta-title">Maktab hayotini kuzatib boring</h4>
              <p className="charter-cta-text">
                Ustozlarimiz bilan tanishing va eng so'nggi yangiliklardan xabardor bo'ling.
              </p>
              <div className="charter-btn-group">
                <Link to="/teachers" className="charter-btn charter-btn-teachers">
                  <FaUsers /> Ustozlarimiz <FaArrowRight />
                </Link>
                <Link to="/news" className="charter-btn charter-btn-news">
                  <FaRegNewspaper /> Maktab Yangiliklari
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
