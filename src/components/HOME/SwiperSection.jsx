import React from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./SwiperSection.css";
import LazyImage from "../LazyImage";
import schoolImageOne from "../../assets/images/Home/MySchoolImageOne.png";
import teacherImageTwo from "../../assets/images/Home/TeachersSmile.png";
import schoolImageTwo from "../../assets/images/Home/SchoolImageTwo.png";
import schoolImageSix from "../../assets/images/Home/SchoolImageSix.png";
import schoolImageThree from "../../assets/images/Home/SchoolImageThree.png";
import schoolImageFive from "../../assets/images/Home/SchoolImageFive.png";
import schoolImageFour from "../../assets/images/Home/SchoolImageFour.png";

export default function SwiperSection() {
  return (
    <section className="display swiperSectionWrap">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={20}
        slidesPerView={1}
        loop={false}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          stopOnLastSlide: true,
        }}
        pagination={{ clickable: true }}
        navigation={true}
        className="mySwiper"
      >
        <SwiperSlide style={{ position: "relative" }}>
          <div className="slideOverlayGradient" />
          <h2 className="swiperTitle">
            Keling, sizni ajoyib maktab qarshi oladi!
          </h2>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={schoolImageSix}
            alt="8-Maktab binosi"
          />
        </SwiperSlide>

        <SwiperSlide style={{ position: "relative" }}>
          <div className="slideOverlayGradient" />
          <h2 className="swiperTitle">Maktab bu — rangli xotiralar</h2>
          <LazyImage
            style={{
              filter: "brightness(105%)",
              objectFit: "cover",
            }}
            className="swiperSlideImage"
            src={schoolImageThree}
            alt="Maktab xotiralari"
          />
        </SwiperSlide>

        <SwiperSlide style={{ position: "relative" }}>
          <div className="slideOverlayGradient" />
          <h2 className="swiperTitle">
            Maktab zali — yoshlikning shavqli va quvnoq damlari
          </h2>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={schoolImageFive}
            alt="Maktab zali"
          />
        </SwiperSlide>

        <SwiperSlide style={{ position: "relative" }}>
          <div className="slideOverlayGradient" />
          <h2 className="swiperTitle">
            Bizning ochiq-ko'ngil va ajoyib ustozlar!
          </h2>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={teacherImageTwo}
            alt="Mehribon ustozlar"
          />
        </SwiperSlide>

        <SwiperSlide style={{ position: "relative" }}>
          <div className="slideOverlayGradient" />
          <h2 className="swiperTitle">
            Har bir dars — kelajak sari tashlangan dadil qadam
          </h2>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={schoolImageOne}
            alt="Dars jarayoni"
          />
        </SwiperSlide>

        <SwiperSlide style={{ position: "relative" }}>
          <div className="slideOverlayGradient" />
          <h2 className="swiperTitle">
            Maktab ostonasi — muvaffaqiyatlarimiz boshlanadigan maskan
          </h2>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={schoolImageTwo}
            alt="Maktab ostonasi"
          />
        </SwiperSlide>

        <SwiperSlide style={{ position: "relative" }}>
          <div className="slideOverlayGradient" />
          <h2 className="swiperTitle">
            Bizning maktab o'zgacha —{" "}
            <span className="swiperHighlight">eshigimiz ochiq, xush ko'ramiz!</span>
          </h2>
          <LazyImage
            style={{
              filter: "brightness(120%)",
              objectFit: "cover",
            }}
            className="swiperSlideImage"
            src={schoolImageFour}
            alt="Maktab hovlisi"
          />
        </SwiperSlide>
      </Swiper>
    </section>
  );
}
