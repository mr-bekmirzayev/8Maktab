import School_Principal from "../../assets/images/About/School_Principal.png";
import LazyImage from "../LazyImage";
export default function PrincipalSection() {
  return (
    <div className="display">
      <ul className="Principal">
        <li>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="principal"
            src={School_Principal}
            alt="Nimadir xato ketdi-ki Rasm ko'rinmay qoldi."   
          />
        </li>
        <li>
          <h1 className="PrincipalName">Djamoldinova Mutabar Xoshimovna</h1>
        </li>
      </ul>
    </div>
  );
}
