import useOffers from "../../hooks/offers/useOffers.js";
import PremiumOffer from "../../components/offers/PremiumOffer.jsx";
import StoreOffers from "../../components/offers/StoreOffers.jsx";
import StoreStatistics from "../../components/store/StoreStatistics.jsx";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import AppFeedbackSnackbar from "../../components/common/feedback/AppFeedbackSnackbar.jsx";
import extractApiError from "../../utils/extractApiError.js";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import { ProductGridSkeleton } from "../../components/product/ProductGrid.jsx";
import CategoryProductSections from "../../components/product/CategoryProductSections.jsx";
import { groupProductsByCategory } from "../../utils/categoryProductGroups.js";
import ProductCarousel from "../../components/product/ProductCarousel.jsx";
import useHighlightProducts from "../../hooks/products/useHighlightProducts.js";
import storeApi from "../../API/store.api.js";
import useAddToCart from "../../hooks/cart/useAddToCart.js";
import useCategories from "../../hooks/categories/useCategories.js";
import useFeaturedProducts from "../../hooks/products/useFeaturedProducts.js";
import useStorefrontCatalogProducts from "../../hooks/products/useStorefrontCatalogProducts.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useTransientBusyState from "../../hooks/useTransientBusyState.js";
import { resolveAssetUrl, resolveStoreCoverUrl, resolveStoreLogoUrl } from "../../utils/assetUrl.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
} from "../../utils/collections.js";
import { buildProductSnapshot } from "../../utils/guestCart.js";
import {
  getProductDisplayVariant,
  getProductImage,
  isProductActive,
  normalizeProductList,
} from "../../utils/products.js";
import useCatalogViewState from "../../hooks/storefront/useCatalogViewState.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import { JUBEH_STORE_SLUG } from "../../theme/storeThemeConfig.js";
import { showStoreStatistics } from "../../theme/storeAppearance.js";
import "./StoreDetails.css";

const CATALOG_PAGE_SIZE = 12;
const initialView = { searchText: "", selectedCategoryId: "all" };

function normalizeVisitCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export default function StoreDetails() {
  const { slug = "" } = useParams();
  const [{ searchText, selectedCategoryId }, updateView] = useCatalogViewState(initialView);
  const [recordedVisit, setRecordedVisit] = useState({
    storeId: "",
    count: null,
  });
  const deferredSearchText = useDeferredValue(searchText);
  const recordedVisitRef = useRef("");
  const { isOwnerPreview, previewSearch, buildStorePreviewPath } =
    useOwnerStorePreview();
  const { t, language } = useStorefrontLanguage();

  const storeQuery = useStoreBySlug(slug, { language });
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);
  const offersQuery = useOffers(store?.id);
  const bundleProductIds = (offersQuery.data || []).filter(o => Number(o.type) === 1).flatMap(o => o.items.map(i => i.productId));
  const highlightsQuery = useHighlightProducts(store?.id, language);
  const highlights = normalizeProductList(highlightsQuery.data).filter(isProductActive);

  const categoriesQuery = useCategories(store?.id, {
    enabled: Boolean(store?.id),
    language,
  });
  const featuredProductsQuery = useFeaturedProducts(store?.id, {
    enabled: Boolean(store?.id),
    language,
  });
  const categories = useMemo(
    () =>
      normalizeListResponse(categoriesQuery.data).filter(
        (category) => category?.id,
      ),
    [categoriesQuery.data],
  );
  const catalogProductsQuery = useStorefrontCatalogProducts(store?.id, {
    enabled: Boolean(store?.id),
    language,
    staleTime: 30000,
  });
  const addToCartMutation = useAddToCart(store?.id);
  const addToCartUi = useTransientBusyState();

  const featuredProducts = useMemo(
    () =>
      normalizeProductList(featuredProductsQuery.data).filter((product) =>
        isProductActive(product),
      ),
    [featuredProductsQuery.data],
  );
  const products = useMemo(
    () => normalizeProductList(catalogProductsQuery.data),
    [catalogProductsQuery.data],
  );
  const allProductGroups = useMemo(
    () => groupProductsByCategory(products, categories, t("منتجات أخرى")),
    [products, categories, t],
  );
  const filteredProducts = useMemo(() => products.filter(product => {
    const keyword = deferredSearchText.trim().toLocaleLowerCase();
    return (selectedCategoryId === "all" || String(product.categoryId || "uncategorized") === selectedCategoryId) &&
      (!keyword || [product.name, product.description, product.shortDescription, product.categoryName, product.sku]
        .some(value => String(value || "").toLocaleLowerCase().includes(keyword)));
  }), [products, deferredSearchText, selectedCategoryId]);
  const categoryGrid = String(store?.themeTemplate ?? store?.ThemeTemplate).toUpperCase() === "C";
  const categorySummary = useMemo(
    () => categoryGrid ? categories : categories.slice(0, 8),
    [categories, categoryGrid],
  );
  const filteredGroups = useMemo(
    () => groupProductsByCategory(filteredProducts, categories, t("منتجات أخرى")),
    [categories, filteredProducts, t],
  );
  const featuredGroups = useMemo(
    () => groupProductsByCategory(featuredProducts, categories, t("منتجات أخرى")),
    [featuredProducts, categories, t],
  );
  const currentStoreId = String(store?.id || "").trim();
  const displayedVisitCount = useMemo(
    () => {
      const hasRecordedVisit =
        recordedVisit.storeId === currentStoreId && recordedVisit.count !== null;

      return normalizeVisitCount(
        hasRecordedVisit ? recordedVisit.count : store?.visitCount,
      );
    },
    [currentStoreId, recordedVisit, store?.visitCount],
  );

  useEffect(() => {
    const storeId = currentStoreId;

    if (!storeId || isOwnerPreview || recordedVisitRef.current === storeId) {
      return;
    }

    recordedVisitRef.current = storeId;
    storeApi
      .visitStore(storeId)
      .then((response) => {
        const nextVisitCount = normalizeVisitCount(response?.visitCount);

        if (nextVisitCount) {
          setRecordedVisit({ storeId, count: nextVisitCount });
        }
      })
      .catch(() => {
        // Ignore visit tracking errors on the public storefront.
      });
  }, [currentStoreId, isOwnerPreview]);

  const handleAddToCart = (product, quantity = 1) => {
    if (store?.isCatalog || isOwnerPreview || !store?.id || !product?.id) {
      return false;
    }

    const defaultVariant = getProductDisplayVariant(product);

    addToCartUi.markBusy(product.id);
    return addToCartMutation.mutateAsync({
      productId: product.id,
      quantity,
      storeId: store.id,
      variantId: defaultVariant?.id || null,
      productSnapshot: buildProductSnapshot(product, {
        variant: defaultVariant,
      }),
      debugSource: "store-details-page",
    });
  };

  const handleSearchChange = (value) => {
    updateView({ searchText: value });
  };

  if (storeQuery.isLoading) {
    return (
      <Box className={`storefront-page page-store-details${categoryGrid ? " page-store-details--category-grid" : ""}`}>
        <EmptyState title={t("جاري تحميل المتجر...")} />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className={`storefront-page page-store-details${categoryGrid ? " page-store-details--category-grid" : ""}`}>
        <EmptyState
          title={t("تعذر العثور على المتجر")}
          description={t("قد يكون الرابط غير صحيح أو أن المتجر لم يعد متاحًا.")}
        />
      </Box>
    );
  }

  const resolvedStoreSlug = store.slug || slug;
  const logoCover = resolvedStoreSlug.toLowerCase() === JUBEH_STORE_SLUG;
  const coverImage = logoCover ? "" : resolveStoreCoverUrl(store);
  const logoImage = resolveStoreLogoUrl(store, { wordmark: logoCover });

  return (
    <Box className={`storefront-page page-store-details${categoryGrid ? " page-store-details--category-grid" : ""}`}>
      <AppFeedbackSnackbar toast={{ open: addToCartMutation.isError, severity: "error",
        message: extractApiError(addToCartMutation.error, t("تعذر إضافة المنتج إلى السلة.")) }}
        onClose={() => addToCartMutation.reset?.()} />
      {addToCartMutation.isError ? (
        <Alert severity="error">{t("تعذر إضافة المنتج إلى السلة.")}</Alert>
      ) : null}

      {addToCartMutation.isSuccess ? (
        <Alert severity="success">{t("تمت إضافة المنتج إلى السلة.")}</Alert>
      ) : null}

      <SurfaceCard variant="hero" className={logoCover ? "page-store-details__hero page-store-details__hero--logo" : "page-store-details__hero"}>
        <Box className="page-store-details__brand-row">
          {logoImage ? (
            <img src={logoImage} alt="" className="storefront-logo" decoding="async" />
          ) : (
            <Box className="storefront-logo storefront-logo--empty" aria-hidden>
              {store.name?.[0] || t("م")}
            </Box>
          )}
          <Typography variant="h1" className="page-store-details__title">{store.name}</Typography>
        </Box>
        {coverImage && <img className="page-store-details__hero-media" src={coverImage} alt="" decoding="async" />}
      </SurfaceCard>

      {!categoryGrid && <>
      {store.isActive !== false && showStoreStatistics(store) && (
        <StoreStatistics key={store.id} storeId={store.id} storeSlug={resolvedStoreSlug}
          visitCount={displayedVisitCount} isOwnerPreview={isOwnerPreview} />
      )}

      <PremiumOffer store={store} disabled={isOwnerPreview} />
      <ProductCarousel products={highlights} productPath={(id) => buildStorePreviewPath(`/market/${store.slug}/product/${id}`)} bundleProductIds={bundleProductIds} bundleOffers={(offersQuery.data || []).filter(o => Number(o.type) === 1)} />
      <StoreOffers store={store} disabled={isOwnerPreview} />
      </>}
      <Box className="storefront-section">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">{t("التصنيفات")}</span>
            <Typography variant="h3">{t("التصنيفات الرئيسية")}</Typography>
          </Box>
        </Box>

        {categoriesQuery.isLoading && !categorySummary.length ? (
          <EmptyState title={t("جاري تحميل التصنيفات...")} />
        ) : categorySummary.length ? (
          <Box className="page-store-details__categories-grid">
            {categorySummary.map((category) => {
              const configuredCategoryImage = resolveAssetUrl(category.imageUrl);
              const categoryProductImage = resolveAssetUrl(
                getProductImage(
                  [...featuredProducts, ...products].find(
                    (product) => String(product?.categoryId || "") === String(category.id),
                  ),
                ),
              );
              const categoryImage = configuredCategoryImage || categoryProductImage || coverImage || "";

              return (
                <SurfaceCard
                  key={category.id}
                  component={RouterLink}
                  to={buildStorePreviewPath(
                    `/market/${resolvedStoreSlug}/category/${category.id}`,
                  )}
                  interactive
                  className={[
                    "page-store-details__category-card",
                    categoryImage ? "page-store-details__category-card--image" : "",
                  ].filter(Boolean).join(" ")}
                  style={
                    categoryImage
                      ? { "--category-card-image": `url("${categoryImage}")` }
                      : undefined
                  }
                >
                  {categoryGrid && categoryImage ? <img src={categoryImage} alt="" loading="lazy" decoding="async" className="page-store-details__category-tile-image" /> : null}
                  <Typography variant="h6">{category.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.description || ""}
                  </Typography>
                  {category.count !== undefined ? (
                    <Typography variant="caption" color="text.secondary">
                      {category.count} {t("منتج")}</Typography>
                  ) : null}
                </SurfaceCard>
              );
            })}
          </Box>
        ) : (
          <EmptyState
            title={t("لا توجد تصنيفات بعد")}
            description={t("ستظهر التصنيفات هنا بمجرد إضافة أقسام ومنتجات داخل المتجر.")}
          />
        )}
      </Box>

      {!categoryGrid && <>
      <Box
        className="storefront-section page-store-details__featured"
        id="store-featured-products"
        data-scroll-section
      >
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">{t("منتجات")}</span>
            <Typography variant="h3">{t("منتجات مختارة")}</Typography>
          </Box>
        </Box>

        {featuredProductsQuery.isLoading && !featuredProducts.length ? (
          <ProductGridSkeleton count={5} />
        ) : featuredProducts.length ? (
          <CategoryProductSections
            groups={featuredGroups}
            scope="store-featured-products"
            storeSlug={resolvedStoreSlug}
            onAddToCart={store?.isCatalog ? undefined : handleAddToCart}
            addingProductId={addToCartUi.activeKey}
            disableCartActions={isOwnerPreview}
            linkSearch={previewSearch}
          />
        ) : (
          <EmptyState title={t("لا توجد منتجات مختارة")} />
        )}
      </Box>

      <Box
        className="storefront-section page-store-details__catalog"
        id="store-catalog"
        data-scroll-section
      >
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">{t("المنتجات")}</span>
            <Typography variant="h3">{t("جميع المنتجات")}</Typography>
          </Box>

          <Box className="page-store-details__catalog-toolbar">
            <Box className="page-store-details__search">
              <SearchInput
                value={searchText}
                onChange={handleSearchChange}
                placeholder={t("ابحث داخل هذا المتجر")}
              />
            </Box>
          </Box>
        </Box>

        {allProductGroups.length > 0 && <Box component="nav" aria-label={t("التصنيفات")} className="store-category-nav">
          <AppButton variant={selectedCategoryId === "all" ? "contained" : "outlined"}
            aria-pressed={selectedCategoryId === "all"} onClick={() => updateView({ selectedCategoryId: "all" })}>
            {t("كل الفئات")}
          </AppButton>
          {allProductGroups.map(group => <AppButton key={group.id}
            variant={selectedCategoryId === group.id ? "contained" : "outlined"}
            aria-pressed={selectedCategoryId === group.id} onClick={() => updateView({ selectedCategoryId: group.id })}>
            {group.name} ({group.products.length})
          </AppButton>)}
        </Box>}
        <Box className="page-store-details__catalog-body">
          {catalogProductsQuery.isLoading ? <ProductGridSkeleton count={CATALOG_PAGE_SIZE} />
            : catalogProductsQuery.error ? <EmptyState title={t("تعذر تحميل المنتجات")} description={t("حاول تحديث الصفحة أو افتح المتجر مرة أخرى.")} />
            : filteredProducts.length ? <>
              <CategoryProductSections groups={filteredGroups} scope="store-catalog"
                storeSlug={resolvedStoreSlug} onAddToCart={store?.isCatalog ? undefined : handleAddToCart}
                addingProductId={addToCartUi.activeKey} disableCartActions={isOwnerPreview} linkSearch={previewSearch} />
            </> : <EmptyState title={t("لا توجد نتائج")} description={t("جرّب كلمة بحث أخرى أو ارجع إلى جميع التصنيفات.")} />}
        </Box>
      </Box>
      </>}
    </Box>
  );
}

