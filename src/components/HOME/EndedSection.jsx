import React from "react";
import { FaBookOpen, FaScaleBalanced, FaShieldHalved } from "react-icons/fa6";

export default function EndedSection() {
  return (
    <section className="endedSection display">
      <div className="endedSection__heading">
        <span className="endedSection__eyebrow">Bizning qadriyatlarimiz</span>
        <h2>Bilim, tarbiya va xavfsiz muhit</h2>
        <p>Maktabimizda har bir o'quvchining kelajagi e'tiborda.</p>
      </div>

      <ul className="endedSec__List">
        <li className="endedSection__card endedSection__card--learning">
          <div className="endedSection__icon">
            <FaBookOpen />
          </div>
          <span className="endedSection__number">01</span>
          <h3>Sifatli ta'lim</h3>
          <p>
            Barcha o'quvchilar sifatli, zamonaviy va ajoyib ta'lim oladilar. Biz
            har bir o'quvchining bilim olishi hamda o'z salohiyatini to'liq
            namoyon etishi uchun barcha zarur sharoitlarni yaratib beramiz.
          </p>
        </li>
        <li className="endedSection__card endedSection__card--character">
          <div className="endedSection__icon">
            <FaScaleBalanced />
          </div>
          <span className="endedSection__number">02</span>
          <h3>Tarbiya va odob</h3>
          <p>
            Ustozlarimiz doimo juda yaxshi tarbiya va yuksak odob-axloq haqida
            aytib kelishadi. Ular o'quvchilarga nafaqat bilim beradi, balki
            jamiyatda munosib inson bo'lib yetishishlariga ham ko'maklashadi.
          </p>
        </li>
        <li className="endedSection__card endedSection__card--safety">
          <div className="endedSection__icon">
            <FaShieldHalved />
          </div>
          <span className="endedSection__number">03</span>
          <h3>Xavfsiz muhit</h3>
          <p>
            Xozirgi nuqtai-nazardan qarasak barchamizda telefon va boshqa
            buyumlar. Beixtiyor farzndingizni bundayin gadjetlardan va o'tkir
            tig'li, elektron (xavfli) asboblardan nazoratga olganmiz.
          </p>
        </li>
      </ul>
    </section>
  );
}
