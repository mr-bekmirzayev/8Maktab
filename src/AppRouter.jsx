import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import News from "./pages/News";
import Teachers from "./pages/Teachers";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ScrollToTop from "./pages/ScrollToTop";
import Seo from "./components/Seo";

function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Seo />
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/admin331257" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

export default AppRouter;
