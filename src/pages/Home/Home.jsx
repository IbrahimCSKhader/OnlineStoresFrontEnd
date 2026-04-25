import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import ProductGrid from "../../components/product/ProductGrid.jsx";
import StoreGrid from "../../components/storefront/StoreGrid.jsx";
import productApi from "../../API/product.api.js";
import { SITE_BRAND_ASSET_PATH } from "../../constants/siteBranding.js";
import useAuth from "../../hooks/auth/useAuth.js";
import useStores from "../../hooks/stores/useStores.js";
import { normalizeListResponse } from "../../utils/collections.js";
import { isProductActive, normalizeProductList } from "../../utils/products.js";
import { getLandingPath } from "../../utils/roles.js";
import "./Home.css";

export default function Home() {
  const { isAuthenticated, role } = useAuth();
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

  const heroStats = [
    { label: "متجر", value: stores.length },
    { label: "فئة", value: storeCategories.length },
    { label: "منتج مختار", value: featuredProducts.length },
  ];

  if (storesQuery.isLoading) {
    return (
      <Box className="storefront-page">
        <LoadingState label="جارٍ تجهيز الصفحة الرئيسية..." />
      </Box>
    );
  }

  if (storesQuery.error) {
    return (
      <Box className="storefront-page">
        <EmptyState
          title="تعذر تجهيز الصفحة الرئيسية"
          description="لم نتمكن من تحميل بيانات المتاجر الآن. حاول مرة أخرى بعد قليل."
          action={
            <AppButton variant="contained" onClick={() => storesQuery.refetch()}>
              إعادة التحميل
            </AppButton>
          }
        />
      </Box>
    );
  }

  return (
    <Box className="storefront-page page-home">
      <SurfaceCard variant="hero" className="storefront-hero page-home__hero">
        <Box className="page-home__hero-grid">
          <Box className="storefront-hero__copy">
            <span className="storefront-eyebrow">الرئيسية</span>
            <Typography variant="h1" className="storefront-title page-home__hero-title">
              المتاجر والمنتجات
            </Typography>

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              <AppButton
                component={RouterLink}
                to={isAuthenticated ? getLandingPath(role) : "/market"}
                variant="contained"
              >
                {isAuthenticated ? "تابع التصفح" : "ابدأ التسوق"}
              </AppButton>
              <AppButton component={RouterLink} to="/market" variant="outlined">
                عرض المتاجر
              </AppButton>
            </Stack>

            <Box className="page-home__hero-stats">
              {heroStats.map((stat) => (
                <Box key={stat.label} className="page-home__hero-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </Box>
              ))}
            </Box>
          </Box>

          <Box className="page-home__hero-media" aria-hidden>
            <img
              src={SITE_BRAND_ASSET_PATH}
              alt="mawja"
              className="page-home__hero-image"
            />
          </Box>
        </Box>
      </SurfaceCard>

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

        {featuredProducts.length ? (
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
          loading={false}
          error={null}
          onRetry={storesQuery.refetch}
        />
      </Box>
    </Box>
  );
}
