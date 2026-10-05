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
          delay: 3000,
          disableOnInteraction: false,
          stopOnLastSlide: true,
        }}
        pagination={{ clickable: true }}
        navigation={true}
        className="mySwiper"
      >
        <SwiperSlide style={{ position: "relative" }}>
          <h2 style={{ backdropFilter: "blur(5px)" }} className="swiperTitle">
            Keling, sizni ajoyib maktab qarshi oladi!
          </h2>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={schoolImageSix}
            alt="Nimadir xato ketdi-ki Rasm ko'rinmay qoldi."
          />
          <div className="blackShadowImageFor"></div>
        </SwiperSlide>
        <SwiperSlide style={{ position: "relative" }}>
          <h1 className="swiperTitle">Maktab bu - rangli xotiralar</h1>

          <LazyImage
            style={{
              filter: "brightness(110%)",
              objectFit: "cover",
            }}
            className="swiperSlideImage"
            src={schoolImageThree}
            alt="Nimadir xato ketdi-ki Rasm ko'rinmay qoldi."
          />
        </SwiperSlide>
        <SwiperSlide style={{ position: "relative" }}>
          <h2 className="swiperTitle">
            Maktab zali — yoshlikning eng shavqli va quvnoq damlari guvohi
          </h2>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={schoolImageFive}
            alt="Nimadir xato ketdi-ki Rasm ko'rinmay qoldi."
          />
          <div className="blackShadowImageFor"></div>
        </SwiperSlide>
        <SwiperSlide style={{ position: "relative" }}>
          <h1 className="swiperTitle">
            Bizning ochiq-ko'ngil va ajoyib ustozlar!
          </h1>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={teacherImageTwo}
            alt="Nimadir xato ketdi-ki Rasm ko'rinmay qoldi."
          />
        </SwiperSlide>
        <SwiperSlide style={{ position: "relative" }}>
          <h1 className="swiperTitle">
            Har bir dars — kelajak sari tashlangan dadil qadam
          </h1>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={schoolImageOne}
            alt="Nimadir xato ketdi-ki Rasm ko'rinmay qoldi."
          />
        </SwiperSlide>
        <SwiperSlide style={{ position: "relative" }}>
          <h2 className="swiperTitle">
            Maktab ostonasi — muvaffaqiyatlarimiz boshlanadigan ilk manzil
          </h2>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="swiperSlideImage"
            src={schoolImageTwo}
            alt="Nimadir xato ketdi-ki Rasm ko'rinmay qoldi."
          />
        </SwiperSlide>
        <SwiperSlide style={{ position: "relative" }}>
          <h2 className="swiperTitle">
            bizning maktab o'zingiz guvoh bo'lganingizdek juda o'zgacha
            <br />
            <center>
              <mark style={{ color: "grey", textShadow: "none" }}>
                eshigimiz ochiq, sizni xush ko'ramiz!
              </mark>
            </center>
          </h2>
          <LazyImage
            style={{
              filter: "brightness(180%)",
              objectFit: "cover",
            }}
            className="swiperSlideImage"
            src={schoolImageFour}
            alt="Nimadir xato ketdi-ki Rasm ko'rinmay qoldi."
          />
        </SwiperSlide>
      </Swiper>
    </section>
  );
}
