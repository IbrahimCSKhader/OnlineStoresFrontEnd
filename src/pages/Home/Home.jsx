import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
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
import useAuth from "../../hooks/auth/useAuth.js";
import useStores from "../../hooks/stores/useStores.js";
import { normalizeListResponse } from "../../utils/collections.js";
import { getLandingPath } from "../../utils/roles.js";
import "./Home.css";

const heroHighlights = [
  "متاجر متنوعة",
  "منتجات مختارة",
  "تصفح سريع",
];

export default function Home() {
  const { isAuthenticated, role } = useAuth();
  const storesQuery = useStores(undefined, { refetchOnWindowFocus: false });
  const stores = useMemo(
    () =>
      normalizeListResponse(storesQuery.data).filter((store) => store.isActive !== false),
    [storesQuery.data],
  );
  const featuredStores = stores.slice(0, 5);

  const featuredProductQueries = useQueries({
    queries: featuredStores.map((store) => ({
      queryKey: ["home", "featured-products", store.id],
      queryFn: () => productApi.getFeaturedProducts(store.id),
      enabled: Boolean(store.id),
      staleTime: 60000,
    })),
  });

  const featuredProducts = useMemo(
    () =>
      featuredProductQueries
        .flatMap((query, index) =>
          normalizeListResponse(query.data)
            .slice(0, 2)
            .map((product) => ({
              ...product,
              storeSlug: featuredStores[index]?.slug,
            })),
        )
        .slice(0, 10),
    [featuredProductQueries, featuredStores],
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
    { label: "منتج مختار", value: featuredProducts.length || 6 },
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
            <span className="storefront-eyebrow">تسوق بسهولة</span>
            <Typography variant="h1" className="storefront-title page-home__hero-title">
              اكتشف متاجر ومنتجات تناسبك في مكان واحد
            </Typography>
            <Typography variant="body1" className="storefront-subtitle page-home__hero-subtitle">
              من الهدايا والأزياء إلى المنتجات اليومية، تصفح متاجر متنوعة وابدأ الشراء من المكان الأقرب لذوقك.
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

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {heroHighlights.map((highlight) => (
                <Chip key={highlight} label={highlight} variant="outlined" />
              ))}
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
            <img src="/onlineStore.jpeg" alt="Online store" className="page-home__hero-image" />
          </Box>
        </Box>
      </SurfaceCard>

      <Box className="storefront-section">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">Featured products</span>
            <Typography variant="h3">منتجات بارزة من متاجر مختلفة</Typography>
          </Box>
        </Box>

        {featuredProducts.length ? (
          <ProductGrid products={featuredProducts} />
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
            <span className="storefront-eyebrow">Store categories</span>
            <Typography variant="h3">تسوق حسب نوع المتجر</Typography>
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
            <span className="storefront-eyebrow">Store directory</span>
            <Typography variant="h3">متاجر ننصحك بزيارتها</Typography>
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
