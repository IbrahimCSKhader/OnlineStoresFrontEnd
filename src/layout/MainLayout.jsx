import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Header from "../components/layout/Header/Header.jsx";
import Footer from "../components/layout/Footer.jsx";
import "./MainLayout.css";

export default function MainLayout() {
  return (
    <Box className="main-layout">
      <Header />
      <Box component="main" className="main-layout__content">
        <Outlet />
      </Box>
      <Box className="main-layout__footer">
        <Footer />
      </Box>
    </Box>
  );
}
