import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";
import "./Footer.css";

const quickLinks = [
  { to: "/", label: "الرئيسية" },
  { to: "/market", label: "المتاجر" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل" },
];

export default function Footer() {
  const { t } = useOwnerLanguage();
  const year = new Date().getFullYear();

  return (
    <Box component="footer" className="store-footer">
      <Box className="store-footer__grid">
        <Box className="store-footer__brand">
          <Typography variant="h4" className="store-footer__title">{t("المتاجر")}</Typography>
        </Box>

        <Box component="nav" className="store-footer__links" aria-label={t("روابط سريعة")}>
          {quickLinks.map((link) => (
            <Box
              key={link.to}
              component={RouterLink}
              to={link.to}
              className="store-footer__link"
            >
              {t(link.label)}
            </Box>
          ))}
        </Box>

        <Box className="store-footer__meta">
          <Box className="store-footer__actions">
            <AppButton component={RouterLink} to="/market" variant="contained">{t("المتاجر")}</AppButton>
            <AppButton component={RouterLink} to="/" variant="text">{t("الرئيسية")}</AppButton>
          </Box>
        </Box>
      </Box>

      <Box className="store-footer__bottom">
        <Typography variant="body2">© {t(year)}</Typography>
      </Box>
    </Box>
  );
}
