import School_Principal from "../../assets/images/About/School_Principal.png";
import LazyImage from "../LazyImage";
export default function PrincipalSection() {
  return (
    <section className="PrinsipalSection display">
      <div className="principalSectionTitleFather">
        <h1 className="PrincipalSectionTitle">Maktab Direktori!</h1>
      </div>
      <ul className="Principal">
        <li>
          <LazyImage
            style={{ objectFit: "cover" }}
            className="principal"
            src={School_Principal}
            alt="Nimadir xato ketdi-ki Rasm ko'rinmay qoldi."
          />
        </li>
        <ul className="principalChild">
          <li className="principalInfo">
            <h2 className="PrincipalName">Djamoldinova Mo'tabar Xoshimovna</h2>
            <p className="principalTitle">
              Mo'tabar Xoshimovna - 1969 yil, 2 - aprelda tavallud topgan.
              Xozirda 8 - Maktab bosh direktori lavozimida ish yuritadi. 20
              yildan beri ushbu 8 - Maktabda halollik va adolatli yoruq yo'lida
              doimo bo'lib ajoyib tarzda ish yuritmoqda. Qo'lidan kelgancha
              o'quvchilarini qo'llab quvvatlaydigan, o'qish va bilim yo'lida
              juda mehribon ustoz ham desak adashmaymiz. Direktorimiz -
              maktabdagi har bir o'quvchini o'z o'gil yoki qizidek ekanligini
              aytadi, shunchaki aytmaydi bunga amin ham bo'lganmiz.
            </p>
          </li>
          <li className="studentsComentaryTwo">
            <h2 className="studentsComentary">O'quvchilar</h2>
            <p style={{marginBottom: "25px"}} className="principalTitle">
              Ushbu ustozimiz boshchiligida maktabimiz nafaqat bilim maskani,
              balki har birimiz uchun qadrdon va mehribon uyga aylangan desa
              mubolagʻa boʻlmaydi.
            </p>
          </li>
        </ul>
      </ul>
    </section>
  );
}
