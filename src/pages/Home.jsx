import EndedSection from "../components/HOME/EndedSection";
import GrowthStats from "../components/HOME/GrowthStats";
import HeroSection from "../components/HOME/HeroSection";
import HomeHighlights from "../components/HOME/HomeHighlights";
import SwiperSection from "../components/HOME/SwiperSection";
import TeachersSection from "../components/HOME/TeachersSection";
import TeachersSmileTwo from "../components/HOME/TeachersSmileTwo";

function Home() {
  return (
    <>
      <main>
        <SwiperSection />
        <HeroSection />
        <TeachersSection />
        <TeachersSmileTwo />
        <GrowthStats />
        <HomeHighlights />
        <EndedSection />
      </main>
    </>
  );
}

export default Home;
