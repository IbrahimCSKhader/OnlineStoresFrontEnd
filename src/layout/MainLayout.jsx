import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Header from "../components/layout/Header/Header.jsx";
import Footer from "../components/layout/Footer.jsx";
import "./MainLayout.css";
import { useResolvedOwnerLanguage } from "../hooks/storefront/useOwnerLanguage.js";
import { OwnerLanguageContext } from "../hooks/storefront/OwnerLanguageContext.js";
import OwnerLocaleBoundary from "./OwnerLocaleBoundary.jsx";

export default function MainLayout() {
  const ownerLanguage = useResolvedOwnerLanguage();
  const { dir, locale, enabled, isLoading } = ownerLanguage;
  if (isLoading) return <Box aria-busy="true" sx={{ minHeight: "60vh" }} />;
  return (
    <OwnerLanguageContext.Provider value={ownerLanguage}><OwnerLocaleBoundary><Box className="main-layout" dir={enabled ? dir : undefined} lang={enabled ? locale : undefined}>
      <Header />
      <Box component="main" className="main-layout__content">
        <Outlet />
      </Box>
      <Box className="main-layout__footer">
        <Footer />
      </Box>
    </Box></OwnerLocaleBoundary></OwnerLanguageContext.Provider>
  );
}
