import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";
import "./Footer.css";

const quickLinks = [
  { to: "/", label: "الرئيسية" },
  { to: "/market", label: "المتاجر" },
  { to: "/about", label: "عن المنصة" },
  { to: "/contact", label: "تواصل معنا" },
];

const quickNotes = [
  "متاجر متنوعة",
  "تصفح سريع",
  "منتجات مختارة",
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <Box component="footer" className="store-footer">
      <Box className="store-footer__grid">
        <Box className="store-footer__brand">
          <Typography variant="overline" className="storefront-eyebrow">
            تسوق براحة
          </Typography>
          <Typography variant="h4" className="store-footer__title">
            اكتشف متاجر جديدة ومنتجات تناسبك بسهولة
          </Typography>
          <Typography variant="body2" color="text.secondary" className="store-footer__lead">
            تصفح المتاجر، قارن المنتجات، وانتقل بسرعة إلى ما تريد شراءه دون تعقيد.
          </Typography>
        </Box>

        <Box component="nav" className="store-footer__links" aria-label="روابط سريعة">
          {quickLinks.map((link) => (
            <Box
              key={link.to}
              component={RouterLink}
              to={link.to}
              className="store-footer__link"
            >
              {link.label}
            </Box>
          ))}
        </Box>

        <Box className="store-footer__meta">
          <Typography variant="subtitle1" className="store-footer__meta-title">
            ابدأ من هنا
          </Typography>
          <Typography variant="body2" color="text.secondary">
            اختر المتاجر الأقرب لاهتمامك وابدأ التصفح من صفحة السوق أو من الصفحة الرئيسية.
          </Typography>
          <Box className="store-footer__actions">
            <AppButton component={RouterLink} to="/market" variant="contained">
              تصفح المتاجر
            </AppButton>
            <AppButton component={RouterLink} to="/" variant="text">
              العودة للرئيسية
            </AppButton>
          </Box>
        </Box>
      </Box>

      <Box className="store-footer__notes">
        {quickNotes.map((note) => (
          <span key={note} className="store-footer__note-pill">
            {note}
          </span>
        ))}
      </Box>

      <Box className="store-footer__bottom">
        <Typography variant="body2">© {year} Online Storefront</Typography>
        <Typography variant="body2" color="text.secondary">
          تجربة تسوق أوضح وأبسط على الهاتف والتابلت واللاب.
        </Typography>
      </Box>
    </Box>
  );
}
