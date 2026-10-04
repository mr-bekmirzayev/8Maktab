import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

function AppRouter() {
  return (
    <>
      <Routes>
        <Route path="*" element={<NotFound/>}/>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/admin331257" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

export default AppRouter;

