import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import StoreGrid from "../../components/storefront/StoreGrid.jsx";
import { SITE_BRAND_ASSET_PATH } from "../../constants/siteBranding.js";
import useStores from "../../hooks/stores/useStores.js";
import { normalizeListResponse } from "../../utils/collections.js";
import "./Home.css";

export default function Home() {
  const storesQuery = useStores(undefined, { refetchOnWindowFocus: false });
  const stores = useMemo(
    () =>
      normalizeListResponse(storesQuery.data).filter((store) => store.isActive !== false),
    [storesQuery.data],
  );
  const exampleStores = ["jubeh-office-furniture", "eman", "animal-kingdom", "fragrance-secret"]
    .map((slug) => stores.find((store) => store.slug === slug))
    .filter(Boolean);

  return (
    <Box className="storefront-page page-home">
      <SurfaceCard variant="hero" className="storefront-hero page-home__hero">
        <Box className="page-home__hero-content">
          <Box className="page-home__hero-media">
            <img src={SITE_BRAND_ASSET_PATH} alt="موجة — Mawja" className="page-home__hero-image" fetchPriority="high" />
          </Box>
          <Typography component="h1" variant="h2" className="page-home__hero-title">
            متجرك الإلكتروني يبدأ مع موجة
          </Typography>
          <Typography className="page-home__hero-subtitle">
            اعرض منتجاتك، واستقبل طلباتك، وابدأ حكاية متجرك معنا.
          </Typography>
          <AppButton component={RouterLink} to="/storeRegister" variant="contained" size="large" className="page-home__register">
            سجّل متجرك
          </AppButton>
          <span className="page-home__trial-note">جرّب موجة 3 أيام مجانًا</span>
          <AppButton component={RouterLink} to="/market" className="page-home__browse">
            تصفّح المتاجر
          </AppButton>
        </Box>
      </SurfaceCard>

      <Box component="section" className="storefront-section page-home__pricing" aria-labelledby="home-pricing-title" dir="rtl">
        <Box className="page-home__pricing-heading">
          <span className="storefront-eyebrow">باقات موجة</span>
          <Typography component="h2" variant="h3" id="home-pricing-title">اختر الباقة المناسبة لمتجرك</Typography>
          <Typography color="text.secondary">بداية مجانية، وباقات واضحة لمشوار متجرك.</Typography>
        </Box>
        <Box className="page-home__plans">
          {[
            { title: "التجربة المجانية", duration: "3 أيام", price: "مجانًا", caption: "تعرّف على موجة وابدأ تجهيز متجرك", action: "ابدأ مجانًا" },
            { title: "الباقة الربع سنوية", duration: "3 أشهر", price: "120", caption: "خطوتك الأولى لتنمية متجرك", action: "سجّل متجرك" },
            { title: "الباقة السنوية", duration: "سنة", price: "450", caption: "سنة كاملة لمتجرك مع موجة", action: "سجّل متجرك", featured: true },
          ].map((plan) => (
            <SurfaceCard key={plan.title} component="article" className={`page-home__plan${plan.featured ? " page-home__plan--featured" : ""}`}>
              <Typography component="h3" variant="h6">{plan.title}</Typography>
              <Typography className="page-home__plan-price">{plan.price}</Typography>
              <Typography className="page-home__plan-duration">{plan.duration}</Typography>
              <Typography color="text.secondary">{plan.caption}</Typography>
              <AppButton component={RouterLink} to="/storeRegister" variant={plan.featured ? "contained" : "outlined"} fullWidth>{plan.action}</AppButton>
            </SurfaceCard>
          ))}
        </Box>
      </Box>

      <Box component="section" className="storefront-section page-home__examples" aria-labelledby="home-examples-title">
        <Box className="page-home__pricing-heading">
          <span className="storefront-eyebrow">mawja</span>
          <Typography component="h2" variant="h3" id="home-examples-title">متاجر انطلقت مع موجة</Typography>
          <Typography color="text.secondary">تعرّف على أمثلة من متاجرنا، وتخيّل متجرك القادم.</Typography>
        </Box>
        <StoreGrid
          stores={exampleStores}
          loading={storesQuery.isLoading}
          error={storesQuery.error}
          onRetry={storesQuery.refetch}
        />
      </Box>
    </Box>
  );
}
