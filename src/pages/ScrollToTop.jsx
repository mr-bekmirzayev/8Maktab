import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  // useLocation har safar sahifa (url) o'zgarganini eshitib turadi
  const { pathname } = useLocation();

  useEffect(() => {
    // Sahifa o'zgarishi bilan skrollni avtomatik tepaga silliq qaytaradi
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  }, [pathname]);

  return null; // Bu komponent ekranda hech narsa chizmaydi, faqat mantiq bajaradi
}

export default ScrollToTop;
