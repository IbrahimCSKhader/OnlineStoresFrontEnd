import { useMemo } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./StoreAbout.css";

function buildStoryParagraphs(store) {
  const story = String(store?.storeStory || "").trim();

  if (story) {
    return story
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  const description = String(store?.description || "").trim();

  return [
    description || "لا توجد نبذة حالياً.",
  ];
}

export default function StoreAbout() {
  const { slug } = useParams();
  const storeQuery = useStoreBySlug(slug);
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-store-about">
        <EmptyState title="جاري التحميل..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-store-about">
        <EmptyState
          title="تعذر فتح الصفحة"
        />
      </Box>
    );
  }

  const storyParagraphs = buildStoryParagraphs(store);

  return (
    <Box className="storefront-page page-store-about">
      <SurfaceCard variant="hero" className="page-store-about__hero">
        <Box className="storefront-section__copy">
          <span className="storefront-eyebrow">من نحن</span>
          <Typography variant="h1" className="storefront-title page-store-about__title">
            {store.name}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {store.businessType ? <Chip label={store.businessType} /> : null}
            <Chip label={store.isActive === false ? "غير نشط" : "نشط"} variant="outlined" />
          </Stack>

          <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
            <AppButton component={RouterLink} to={`/market/${slug}`} variant="contained">
              العودة لواجهة المتجر
            </AppButton>
            <AppButton component={RouterLink} to={`/market/${slug}/contact`} variant="outlined">
              تواصل معنا
            </AppButton>
          </Stack>
        </Box>
      </SurfaceCard>

      <Box className="storefront-grid">
        <Box className="storefront-grid__span-8">
          <SurfaceCard className="page-store-about__story-card">
            <Box className="page-store-about__section-head">
              <AutoStoriesRoundedIcon fontSize="small" />
              <Typography variant="h4">نبذة</Typography>
            </Box>

            <Box className="page-store-about__story">
              {storyParagraphs.map((paragraph, index) => (
                <Typography key={`${index}-${paragraph.slice(0, 18)}`} variant="body1" color="text.secondary">
                  {paragraph}
                </Typography>
              ))}
            </Box>
          </SurfaceCard>
        </Box>

        <Box className="storefront-grid__span-4">
          <SurfaceCard className="page-store-about__info-card">
            <Box className="page-store-about__section-head">
              <StorefrontRoundedIcon fontSize="small" />
              <Typography variant="h5">معلومات</Typography>
            </Box>

            <Box className="page-store-about__info-list">
              <Box className="page-store-about__info-item">
                <Typography variant="body2" color="text.secondary">
                  اسم المتجر
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {store.name}
                </Typography>
              </Box>

              <Box className="page-store-about__info-item">
                <Typography variant="body2" color="text.secondary">
                  نوع النشاط
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {store.businessType || "غير محدد"}
                </Typography>
              </Box>

              <Box className="page-store-about__info-item">
                <Typography variant="body2" color="text.secondary">
                  الحالة
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {store.isActive === false ? "غير نشط" : "نشط"}
                </Typography>
              </Box>
            </Box>
          </SurfaceCard>
        </Box>
      </Box>
    </Box>
  );
}
