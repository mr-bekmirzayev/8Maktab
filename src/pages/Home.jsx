import EndedSection from "../components/HOME/EndedSection";
import GrowthStats from "../components/HOME/GrowthStats";
import HeroSection from "../components/HOME/HeroSection";
import HomeHighlights from "../components/HOME/HomeHighlights";
import SwiperSection from "../components/HOME/SwiperSection";
import TeachersSection from "../components/HOME/TeachersSection";
import TeachersSmileTwo from "../components/HOME/TeachersSmileTwo";
import SchoolGeoMap from "../components/common/SchoolGeoMap";

function Home() {
  return (
    <>
      <main style={{ position: "relative" }}>
        <SwiperSection />
        <HeroSection />
        <TeachersSection />
        <TeachersSmileTwo />
        <GrowthStats />
        <HomeHighlights />
        <SchoolGeoMap />
        <EndedSection />
      </main>
    </>
  );
}

export default Home;
