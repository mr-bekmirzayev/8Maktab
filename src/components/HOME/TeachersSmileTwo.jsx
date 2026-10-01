import LazyImage from "../LazyImage";
import TeachersSmileTwoImage from "../../assets/images/Home/TeachersSmileTwo.png";
import TeachersSmileThree from "../../assets/images/Home/TeachersSmileThree.png";
import TeachersSmileFour from "../../assets/images/Home/TeachersSmileFour.png";
import TeachersSmileFive from "../../assets/images/Home/TeachersSmileFIve.png";
import TeachersSmileSix from "../../assets/images/Home/TeachersSmileSix.png";

export default function TeachersSmileTwo() {
  return (
    <section className="teachersSmileSection">
      <h2 className="teachersSmileTitle">Bizning faxrimiz bo'lgan ustozlar</h2>
      <ul className="teachersSmileList">
        <li className="teachersSmileItem teachersSmileItemTopLeft">
          <LazyImage
            className="teachersSmile"
            src={TeachersSmileTwoImage}
            alt="Teachers"
          />
        </li>
        <li className="teachersSmileItem teachersSmileItemTopRight">
          <LazyImage
            style={{ width: 800, height: 450 }}
            className="teachersSmile"
            src={TeachersSmileThree}
            alt="Teachers"
          />
        </li>
        <li className="teachersSmileItem teachersSmileItemBottom">
          <LazyImage
            className="teachersSmile"
            src={TeachersSmileFour}
            alt="Teachers"
          />
        </li>
        <li className="teachersSmileItem">
          <LazyImage
            className="teachersSmile"
            src={TeachersSmileFive}
            alt="Teachers"
          />
        </li>
        <li className="teachersSmileItem">
          <LazyImage
            className="teachersSmile"
            src={TeachersSmileSix}
            alt="Teachers"
          />
        </li>
      </ul>
    </section>
  );
}
