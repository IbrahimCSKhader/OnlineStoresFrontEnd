import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import ProductGrid from "../../components/product/ProductGrid.jsx";
import StoreGrid from "../../components/storefront/StoreGrid.jsx";
import productApi from "../../API/product.api.js";
import { SITE_BRAND_ASSET_PATH } from "../../constants/siteBranding.js";
import useStores from "../../hooks/stores/useStores.js";
import { normalizeListResponse } from "../../utils/collections.js";
import { isProductActive, normalizeProductList } from "../../utils/products.js";
import "./Home.css";

export default function Home() {
  const storesQuery = useStores(undefined, { refetchOnWindowFocus: false });
  const stores = useMemo(
    () =>
      normalizeListResponse(storesQuery.data).filter((store) => store.isActive !== false),
    [storesQuery.data],
  );
  const featuredStores = stores.slice(0, 5);
  const featuredProductStores = stores.slice(0, 10);

  const featuredProductQueries = useQueries({
    queries: featuredProductStores.map((store) => ({
      queryKey: ["home", "featured-products", store.id],
      queryFn: () => productApi.getFeaturedProducts(store.id),
      enabled: Boolean(store.id),
      staleTime: 60000,
    })),
  });

  const featuredProducts = useMemo(
    () =>
      featuredProductQueries
        .map((query, index) => {
          const featuredProduct = normalizeProductList(query.data).find((product) =>
            isProductActive(product),
          );

          if (!featuredProduct) {
            return null;
          }

          return {
            ...featuredProduct,
            storeSlug: featuredProductStores[index]?.slug,
          };
        })
        .filter(Boolean)
        .slice(0, 10),
    [featuredProductQueries, featuredProductStores],
  );

  const storeCategories = useMemo(() => {
    const counts = new Map();

    stores.forEach((store) => {
      const key = store.businessType || "متجر عام";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [stores]);

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

      <Box
        className="storefront-section"
        id="home-featured-products"
        data-scroll-section
      >
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">منتجات</span>
            <Typography variant="h3">منتجات مختارة</Typography>
          </Box>
        </Box>

        {storesQuery.isLoading || featuredProductQueries.some((query) => query.isLoading) ? (
          <LoadingState label="جارٍ تحميل المنتجات..." />
        ) : storesQuery.error ? (
          <EmptyState title="تعذر تحميل المنتجات" description="حاول إعادة تحميل المتاجر أدناه." />
        ) : featuredProducts.length ? (
          <ProductGrid
            products={featuredProducts}
            className="page-home__featured-grid"
            scrollAnchorScope="home-featured-products"
          />
        ) : (
          <EmptyState
            title="لا توجد منتجات بارزة بعد"
            description="ستظهر هنا المنتجات الأبرز من المتاجر المتاحة بمجرد إضافتها."
          />
        )}
      </Box>

      <Box className="storefront-section">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">أقسام</span>
            <Typography variant="h3">حسب النوع</Typography>
          </Box>
        </Box>

        <Box className="storefront-cards-grid">
          {storeCategories.map((category) => (
            <SurfaceCard key={category.label} className="page-home__category-card">
              <CategoryRoundedIcon fontSize="small" />
              <Typography variant="h6">{category.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {category.count} متجر في هذا القسم
              </Typography>
            </SurfaceCard>
          ))}
        </Box>
      </Box>

      <Box className="storefront-section">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">متاجر</span>
            <Typography variant="h3">المتاجر</Typography>
          </Box>

          <AppButton component={RouterLink} to="/market" variant="outlined">
            عرض جميع المتاجر
          </AppButton>
        </Box>

        <StoreGrid
          stores={featuredStores}
          loading={storesQuery.isLoading}
          error={storesQuery.error}
          onRetry={storesQuery.refetch}
        />
      </Box>
    </Box>
  );
}
