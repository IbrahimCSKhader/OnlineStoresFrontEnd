import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";
import { getStoreContactEntries } from "../../utils/storeContacts.js";
import "./StoreFooter.css";

function getStorySnippet(store) {
  const story = String(store?.storeStory || "").trim();
  const description = String(store?.description || "").trim();
  const source = story || description;

  if (!source) {
    return "واجهة هذا المتجر مبنية لتبقي العميل داخل تجربة موحدة وواضحة من أول زيارة وحتى التواصل والطلب.";
  }

  return source.length > 220 ? `${source.slice(0, 220).trim()}...` : source;
}

export default function StoreFooter({ store, slug = "" }) {
  const year = new Date().getFullYear();
  const contactEntries = getStoreContactEntries(store);
  const primaryWhatsApp = contactEntries.find((entry) => entry.platform === "WhatsApp");
  const localLinks = [
    { to: `/market/${slug}`, label: "الرئيسية" },
    { to: `/market/${slug}/about`, label: "About Us" },
    { to: `/market/${slug}/contact`, label: "Contact Us" },
    { to: `/market/${slug}/cart`, label: "السلة" },
  ];

  return (
    <Box component="footer" className="store-local-footer">
      <Box className="store-local-footer__grid">
        <Box className="store-local-footer__story">
          <Typography variant="overline" className="storefront-eyebrow">
            داخل {store?.name || "المتجر"}
          </Typography>
          <Typography variant="h4" className="store-local-footer__title">
            تجربة مستقلة بالكامل لهذا المتجر
          </Typography>
          <Typography variant="body2" color="text.secondary" className="store-local-footer__lead">
            {getStorySnippet(store)}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={store?.businessType || "متجر رقمي"} variant="outlined" />
            <Chip label={store?.isActive === false ? "غير نشط" : "نشط"} variant="outlined" />
            {contactEntries.length ? (
              <Chip label={`${contactEntries.length} قناة تواصل`} variant="outlined" />
            ) : null}
          </Stack>
        </Box>

        <Box component="nav" className="store-local-footer__links" aria-label="روابط المتجر">
          {localLinks.map((link) => (
            <Box
              key={link.to}
              component={RouterLink}
              to={link.to}
              className="store-local-footer__link"
            >
              {link.label}
            </Box>
          ))}
        </Box>

        <Box className="store-local-footer__actions">
          <Typography variant="subtitle1" className="store-local-footer__actions-title">
            الوصول السريع
          </Typography>
          <Typography variant="body2" color="text.secondary">
            أبقينا كل التنقلات داخل هذا المتجر نفسه حتى تبقى التجربة متصلة من التصفح وحتى التواصل.
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <AppButton component={RouterLink} to={`/market/${slug}/about`} variant="contained">
              قراءة نبذة المتجر
            </AppButton>
            <AppButton component={RouterLink} to={`/market/${slug}/contact`} variant="outlined">
              فتح صفحة التواصل
            </AppButton>
            {primaryWhatsApp?.url ? (
              <AppButton component="a" href={primaryWhatsApp.url} target="_blank" rel="noreferrer" variant="text">
                راسلنا على واتساب
              </AppButton>
            ) : null}
          </Stack>
        </Box>
      </Box>

      <Box className="store-local-footer__bottom">
        <Typography variant="body2">© {year} {store?.name || "Storefront"}</Typography>
        <Typography variant="body2" color="text.secondary">
          الروابط هنا خاصة بهذا المتجر فقط ولا تعيدك إلى الصفحة العامة للموقع.
        </Typography>
      </Box>
    </Box>
  );
}
