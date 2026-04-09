import { useDeferredValue, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import ProductGrid from "../../components/product/ProductGrid.jsx";
import useAddToCart from "../../hooks/cart/useAddToCart.js";
import useProducts from "../../hooks/products/useProducts.js";
import useCategories from "../../hooks/categories/useCategories.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useTransientBusyState from "../../hooks/useTransientBusyState.js";
import { resolveAssetUrl, resolveStoreCoverUrl } from "../../utils/assetUrl.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
} from "../../utils/collections.js";
import { buildProductSnapshot } from "../../utils/guestCart.js";
import { buildCategorySummary } from "../../utils/storefront.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./StoreDetails.css";

export default function StoreDetails() {
  const { slug } = useParams();
  const [searchText, setSearchText] = useState("");
  const deferredSearchText = useDeferredValue(searchText);
  const storeQuery = useStoreBySlug(slug);
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);

  const productsQuery = useProducts(store?.id, undefined, {
    enabled: Boolean(store?.id),
  });
  const categoriesQuery = useCategories(store?.id, {
    enabled: Boolean(store?.id),
  });
  const addToCartMutation = useAddToCart(store?.id);
  const addToCartUi = useTransientBusyState();

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-store-details">
        <EmptyState title="جاري تحميل المتجر..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-store-details">
        <EmptyState
          title="تعذر العثور على المتجر"
          description="قد يكون الرابط غير صحيح أو أن المتجر لم يعد متاحًا."
        />
      </Box>
    );
  }

  const coverImage = resolveStoreCoverUrl(store);
  const logoImage = resolveAssetUrl(store.logoUrl);
  const products = normalizeListResponse(productsQuery.data);
  const categories = normalizeListResponse(categoriesQuery.data);
  const keyword = deferredSearchText.toLowerCase().trim();
  const filteredProducts = keyword
    ? products.filter((product) =>
        [product.name, product.description, product.shortDescription, product.slug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword)),
      )
    : products;

  const categorySummary = buildCategorySummary(products, categories).slice(0, 8);
  const featuredProducts = [...products]
    .sort((left, right) => {
      if (Boolean(left.isFeatured) !== Boolean(right.isFeatured)) {
        return Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured));
      }

      return Number(right.visitCount ?? 0) - Number(left.visitCount ?? 0);
    })
    .slice(0, 6);

  const handleAddToCart = (product) => {
    if (!store?.id || !product?.id) return;

    addToCartUi.markBusy(product.id);
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      storeId: store.id,
      variantId: null,
      productSnapshot: buildProductSnapshot(product),
      debugSource: "store-details-page",
    });
  };

  return (
    <Box className="storefront-page page-store-details">
      {addToCartMutation.isError ? (
        <Alert severity="error">تعذر إضافة المنتج إلى السلة.</Alert>
      ) : null}

      {addToCartMutation.isSuccess ? (
        <Alert severity="success">تمت إضافة المنتج إلى السلة.</Alert>
      ) : null}

      <SurfaceCard variant="hero" className="storefront-hero page-store-details__hero">
        {coverImage ? (
          <Box className="page-store-details__hero-media" aria-hidden>
            <img src={coverImage} alt="" decoding="async" />
          </Box>
        ) : (
          <Box
            className="page-store-details__hero-media page-store-details__hero-media--empty"
            aria-hidden
          >
            <StorefrontRoundedIcon />
          </Box>
        )}

        <Box className="page-store-details__hero-overlay" aria-hidden />

        <Box className="page-store-details__hero-grid">
          <Box className="storefront-stack page-store-details__hero-main">
            <span className="storefront-eyebrow">المتجر</span>

            <Box className="page-store-details__brand-row">
              {logoImage ? (
                <img
                  src={logoImage}
                  alt={`${store.name} logo`}
                  className="storefront-logo"
                  decoding="async"
                />
              ) : (
                <Box className="storefront-logo storefront-logo--empty">
                  {store.name?.[0] || "م"}
                </Box>
              )}

              <Box className="storefront-stack">
                <Typography variant="h1" className="storefront-title page-store-details__title">
                  {store.name}
                </Typography>
                <Typography variant="body1" className="storefront-subtitle">
                  {store.description || ""}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {store.businessType ? <Chip label={store.businessType} /> : null}
              <Chip label={`${products.length} منتج`} variant="outlined" />
              <Chip label={`${categories.length} تصنيف`} variant="outlined" />
              <Chip label={store.isActive ? "نشط" : "غير نشط"} variant="outlined" />
            </Stack>

            <Box className="storefront-hero__metrics page-store-details__hero-metrics">
              <SurfaceCard className="storefront-metric">
                <StorefrontRoundedIcon fontSize="small" />
                <span className="storefront-metric__label">التصنيفات</span>
                <strong className="storefront-metric__value">{categories.length}</strong>
              </SurfaceCard>
              <SurfaceCard className="storefront-metric">
                <LocalMallRoundedIcon fontSize="small" />
                <span className="storefront-metric__label">المنتجات</span>
                <strong className="storefront-metric__value">{products.length}</strong>
              </SurfaceCard>
              <SurfaceCard className="storefront-metric">
                <VisibilityRoundedIcon fontSize="small" />
                <span className="storefront-metric__label">الزيارات</span>
                <strong className="storefront-metric__value">{store.visitCount ?? 0}</strong>
              </SurfaceCard>
            </Box>

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              <AppButton href="#store-catalog" variant="contained">
                تصفح الكتالوج
              </AppButton>
              <AppButton
                component={RouterLink}
                to={`/market/${store.slug}/cart`}
                variant="outlined"
                startIcon={<LocalMallRoundedIcon fontSize="small" />}
              >
                السلة
              </AppButton>
            </Stack>
          </Box>
        </Box>
      </SurfaceCard>

      <Box className="storefront-section">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">Categories</span>
            <Typography variant="h3">التصنيفات الرئيسية</Typography>
          </Box>
        </Box>

        {categorySummary.length ? (
          <Box className="storefront-cards-grid page-store-details__categories-grid">
            {categorySummary.map((category) => (
              <SurfaceCard
                key={category.id}
                component={RouterLink}
                to={`/market/${store.slug}/category/${category.id}`}
                interactive
                className="page-store-details__category-card"
              >
                <Typography variant="h6">{category.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.description || ""}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {category.count} منتج
                </Typography>
              </SurfaceCard>
            ))}
          </Box>
        ) : (
          <EmptyState
            title="لا توجد تصنيفات بعد"
            description="ستظهر التصنيفات هنا بمجرد إضافة أقسام ومنتجات داخل المتجر."
          />
        )}
      </Box>

      <Box className="storefront-section page-store-details__featured">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">منتجات</span>
            <Typography variant="h3">منتجات مختارة</Typography>
          </Box>
        </Box>

        {featuredProducts.length ? (
          <ProductGrid
            products={featuredProducts}
            storeSlug={store.slug}
            onAddToCart={handleAddToCart}
            addingProductId={addToCartUi.activeKey}
          />
        ) : (
          <EmptyState
            title="لا توجد منتجات"
          />
        )}
      </Box>

      <Box className="storefront-section page-store-details__catalog" id="store-catalog">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">المنتجات</span>
            <Typography variant="h3">جميع المنتجات</Typography>
          </Box>

          <Box className="page-store-details__search">
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="ابحث داخل هذا المتجر"
            />
          </Box>
        </Box>

        <Box className="page-store-details__catalog-body">
          {productsQuery.isLoading ? (
            <EmptyState title="جاري تحميل المنتجات..." />
          ) : filteredProducts.length ? (
            <ProductGrid
              products={filteredProducts}
              storeSlug={store.slug}
              onAddToCart={handleAddToCart}
              addingProductId={addToCartUi.activeKey}
            />
          ) : (
            <EmptyState
              title="لا توجد نتائج"
              description="جرّب كلمة بحث أخرى أو ارجع إلى جميع التصنيفات."
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
