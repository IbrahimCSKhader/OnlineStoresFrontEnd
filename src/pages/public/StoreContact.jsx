import { useMemo } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import MusicVideoRoundedIcon from "@mui/icons-material/MusicVideoRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { getStoreContactEntries } from "../../utils/storeContacts.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./StoreContact.css";

const platformVisuals = {
  Instagram: {
    icon: <InstagramIcon fontSize="small" />,
    color: "#e4405f",
    accent: "rgba(228, 64, 95, 0.14)",
  },
  TikTok: {
    icon: <MusicVideoRoundedIcon fontSize="small" />,
    color: "#111111",
    accent: "rgba(17, 17, 17, 0.1)",
  },
  Facebook: {
    icon: <FacebookRoundedIcon fontSize="small" />,
    color: "#1877f2",
    accent: "rgba(24, 119, 242, 0.12)",
  },
  Snapchat: {
    icon: <CameraAltRoundedIcon fontSize="small" />,
    color: "#d6b800",
    accent: "rgba(214, 184, 0, 0.14)",
  },
  WhatsApp: {
    icon: <WhatsAppIcon fontSize="small" />,
    color: "#25d366",
    accent: "rgba(37, 211, 102, 0.14)",
  },
};

export default function StoreContact() {
  const { slug } = useParams();
  const storeQuery = useStoreBySlug(slug);
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-store-contact">
        <EmptyState title="جاري تجهيز صفحة التواصل..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-store-contact">
        <EmptyState
          title="تعذر فتح صفحة التواصل"
          description="لم نتمكن من تحميل بيانات حسابات التواصل الخاصة بهذا المتجر."
        />
      </Box>
    );
  }

  const contactEntries = getStoreContactEntries(store);

  return (
    <Box className="storefront-page page-store-contact">
      <SurfaceCard variant="hero" className="page-store-contact__hero">
        <Box className="storefront-section__copy">
          <span className="storefront-eyebrow">Contact Us</span>
          <Typography variant="h1" className="storefront-title page-store-contact__title">
            تواصل مع {store.name}
          </Typography>
          <Typography variant="body1" className="storefront-subtitle">
            الروابط هنا تُبنى من بيانات الباك الحالية فقط: `Platform + Username`، ومع واتساب نولّد الرابط من الرقم المخزن بدل حفظ رابط كامل في قاعدة البيانات.
          </Typography>

          <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
            <AppButton component={RouterLink} to={`/market/${slug}`} variant="contained">
              العودة لواجهة المتجر
            </AppButton>
            <AppButton component={RouterLink} to={`/market/${slug}/about`} variant="outlined">
              قراءة about us
            </AppButton>
          </Stack>
        </Box>
      </SurfaceCard>

      {contactEntries.length ? (
        <Box className="page-store-contact__grid">
          {contactEntries.map((contact) => {
            const platformVisual = platformVisuals[contact.platform] || platformVisuals.Instagram;

            return (
              <SurfaceCard
                key={contact.id}
                component="a"
                href={contact.url}
                target="_blank"
                rel="noreferrer"
                interactive
                className="page-store-contact__card"
                style={{
                  "--platform-color": platformVisual.color,
                  "--platform-accent": platformVisual.accent,
                }}
              >
                <Box className="page-store-contact__icon" aria-hidden>
                  {platformVisual.icon}
                </Box>

                <Box className="page-store-contact__card-copy">
                  <Typography variant="overline" className="page-store-contact__platform">
                    {contact.platform}
                  </Typography>
                  <Typography variant="h6">{contact.label || contact.platform}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {contact.displayValue}
                  </Typography>
                </Box>

                <Typography variant="body2" className="page-store-contact__cta">
                  افتح الرابط
                </Typography>
              </SurfaceCard>
            );
          })}
        </Box>
      ) : (
        <EmptyState
          title="لا توجد حسابات تواصل مضافة بعد"
          description="بمجرد وصول `ContactAccounts` أو `WhatsAppNumber` من الباك ستظهر هنا بشكل روابط جاهزة للفتح."
        />
      )}
    </Box>
  );
}
