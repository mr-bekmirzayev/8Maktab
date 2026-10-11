import { FaArrowRight, FaRegNewspaper } from "react-icons/fa6";
import { Link } from "react-router-dom";
import LazyImage from "../LazyImage";
import schoolYardImage from "../../assets/images/Home/SchoolImageFour.png";
import schoolHallImage from "../../assets/images/Home/SchoolImageFive.png";
import "./HomeHighlights.css";

export default function HomeHighlights() {
  return (
    <>
      <section className="homeCampusSection display">
        <div className="homeCampusIntro">
          <span className="homeHighlightsEyebrow">Maktabimizdan lavhalar</span>
          <h2>Maktabimiz muhiti</h2>
          <p>
            Har kuni bilim va do'stlik bilan to'ladigan maktabimiz hududidan
            lavhalar.
          </p>
        </div>

        <div className="homeCampusGallery">
          <figure className="homeCampusPhoto homeCampusPhotoYard">
            <LazyImage
              src={schoolYardImage}
              alt="Maktab hovlisidagi yashil hudud"
              className="homeCampusImage"
            />
            <figcaption>
              <span>01</span>
              <strong>Maktab hovlisi</strong>
            </figcaption>
          </figure>
          <figure className="homeCampusPhoto homeCampusPhotoHall">
            <LazyImage
              src={schoolHallImage}
              alt="Maktabning ichki koridori"
              className="homeCampusImage"
            />
            <figcaption>
              <span>02</span>
              <strong>Maktab ichkarisidan</strong>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="homeExploreSection display">
        <div className="homeExploreCopy">
          <span className="homeHighlightsEyebrow">
            8-maktab bilan tanishing
          </span>
          <h2>Maktab hayotiga yaqinroq bo'ling</h2>
          <p>
            Maktabimiz, ustozlarimiz va so'nggi voqealar haqida batafsil
            ma'lumotlarni tegishli sahifalardan ko'ring.
          </p>
        </div>
        <div className="homeExploreLinks">
          <Link to="/about" className="homeExploreLink homeExploreLinkAbout">
            Maktab haqida <FaArrowRight aria-hidden="true" />
          </Link>
          <Link to="/news" className="homeExploreLink homeExploreLinkNews">
            <FaRegNewspaper aria-hidden="true" /> Yangiliklar
          </Link>
        </div>
      </section>
    </>
  );
}
