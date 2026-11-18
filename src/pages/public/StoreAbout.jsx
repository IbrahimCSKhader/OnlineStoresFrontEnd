import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import StoreContactAccounts from "../../components/common/StoreContactAccounts.jsx";
import StoreStatistics from "../../components/store/StoreStatistics.jsx";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useStorefrontCatalogProducts from "../../hooks/products/useStorefrontCatalogProducts.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { resolveAssetUrl, resolveStoreLogoUrl } from "../../utils/assetUrl.js";
import { getProductImage } from "../../utils/products.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./StoreAbout.css";

export default function StoreAbout() {
  const { slug } = useParams();
  const { buildStorePreviewPath, isOwnerPreview } = useOwnerStorePreview();
  const { t, language } = useStorefrontLanguage();
  const storeQuery = useStoreBySlug(slug, { language });
  const store = useMemo(() => normalizeEntityResponse(storeQuery.data), [storeQuery.data]);
  const products = useStorefrontCatalogProducts(store?.id, {
    language, params: { page: 1, pageSize: 12 },
    placeholderData: undefined,
  });
  const [failedImages, setFailedImages] = useState(() => new Set());
  useStoreBranding(store);

  if (storeQuery.isLoading) {
    return <Box className="storefront-page page-store-about"><EmptyState title={t("جاري التحميل...")} /></Box>;
  }
  if (storeQuery.error || !store) {
    return <Box className="storefront-page page-store-about"><EmptyState title={t("تعذر فتح الصفحة")} /></Box>;
  }

  const storePath = `/market/${store.slug || slug}`;
  const logo = resolveStoreLogoUrl(store);
  const cover = resolveAssetUrl(store.coverImageUrl);
  const seen = new Set([resolveAssetUrl(store.logoUrl), logo]);
  const photos = [
    { url: cover, name: store.name },
    ...(products.data || []).map(product => ({
      url: resolveAssetUrl(getProductImage(product)), name: product.name, id: product.id,
    })),
  ].filter(photo => {
    if (!photo.url || seen.has(photo.url) || failedImages.has(photo.url)) return false;
    seen.add(photo.url);
    return true;
  }).slice(0, 4);
  const onImageError = event => {
    const url = event.currentTarget.getAttribute("src");
    setFailedImages(previous => new Set([...previous, url]));
  };
  const story = String(store.storeStory || store.description || "").trim();
  const paragraphs = story.split(/\n+/).map(line => line.trim()).filter(Boolean);

  return (
    <Box className="storefront-page page-store-about">
      <SurfaceCard variant="hero" className={`page-store-about__hero${photos.length ? " page-store-about__hero--photo" : ""}`}>
        <Box className="page-store-about__intro">
          {logo && !failedImages.has(logo) && <img className="page-store-about__logo" src={logo} alt="" onError={onImageError} />}
          <span className="storefront-eyebrow">{t("من نحن")}</span>
          <Typography component="h1" variant="h1" className="page-store-about__title">{store.name}</Typography>
          {store.businessType && <Typography className="page-store-about__business" color="primary">{store.businessType}</Typography>}
          <Typography className="page-store-about__welcome" color="text.secondary">
            {t("وراء كل اختيار حكاية. اكتشفوا متجرنا، وتعرّفوا على ما نقدّمه لكم.")}
          </Typography>
          <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
            <AppButton component={RouterLink} to={buildStorePreviewPath(storePath)} variant="contained">{t("تصفح الكتالوج")}</AppButton>
            <AppButton component={RouterLink} to={buildStorePreviewPath(`${storePath}/contact`)} variant="outlined">{t("تواصل معنا")}</AppButton>
          </Stack>
        </Box>
        {photos[0] && <Box className="page-store-about__hero-photo">
          <img key={photos[0].url} src={photos[0].url} alt={photos[0].name} decoding="async" onError={onImageError} />
        </Box>}
      </SurfaceCard>

      <StoreStatistics key={store.id} storeId={store.id} storeSlug={store.slug || slug}
        visitCount={store.visitCount} isOwnerPreview={isOwnerPreview} showRatingForm={false} />

      <SurfaceCard component="section" className="page-store-about__story-card">
        <Box className="page-store-about__story-heading">
          <span className="storefront-eyebrow">{store.name}</span>
          <Typography component="h2" variant="h3">{t("نبذة")}</Typography>
        </Box>
        <Box className="page-store-about__story">
          {paragraphs.length ? paragraphs.map((paragraph, index) => (
            /^\+?\d{8,15}$/.test(paragraph)
              ? <Typography component="a" key={index} href={`tel:${paragraph}`} color="primary" dir="ltr">{paragraph}</Typography>
              : <Typography key={index} color="text.secondary">{paragraph}</Typography>
          )) : <Typography color="text.secondary">{t("هنا تبدأ رحلتكم لاكتشاف ما يناسبكم. تصفّحوا منتجاتنا، قارنوا التفاصيل، وتواصلوا معنا لنساعدكم في الاختيار.")}</Typography>}
          <Typography color="text.secondary">{t("اختياركم يهمّنا، وأسئلتكم مرحّب بها. يسعدنا أن نكون جزءًا من تجربتكم القادمة.")}</Typography>
        </Box>
      </SurfaceCard>

      {photos.length > 1 && <Box component="section" className="page-store-about__gallery-section">
        <Typography component="h2" variant="h3">{t("من متجرنا")}</Typography>
        <Box className="page-store-about__gallery">
          {photos.slice(1).map(photo => <SurfaceCard key={photo.url} component={RouterLink}
            to={buildStorePreviewPath(photo.id ? `${storePath}/product/${photo.id}` : storePath)}
            interactive className="page-store-about__photo-card">
            <Box className="page-store-about__photo"><img src={photo.url} alt={photo.name} loading="lazy" decoding="async" onError={onImageError} /></Box>
            <Box className="page-store-about__caption"><Typography component="span" fontWeight={600}>{photo.name}</Typography><ArrowOutwardRounded aria-hidden="true" /></Box>
          </SurfaceCard>)}
        </Box>
      </Box>}

      <SurfaceCard component="section" className="page-store-about__contact">
        <Box className="page-store-about__contact-copy">
          <Typography component="h2" variant="h3">{t("نحن هنا لمساعدتك")}</Typography>
          <Typography color="text.secondary">{t("نسعد بالرد على أسئلتك المتعلقة بالمنتجات، التوفر، والطلبات.")}</Typography>
        </Box>
        <StoreContactAccounts store={store} layout="compact" showTitle={false} translate={t} />
        <AppButton component={RouterLink} to={buildStorePreviewPath(`${storePath}/contact`)} variant="outlined">{t("تواصل معنا")}</AppButton>
      </SurfaceCard>
    </Box>
  );
}
