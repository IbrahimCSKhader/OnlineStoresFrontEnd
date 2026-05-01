import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import ProductGrid from "../../components/product/ProductGrid.jsx";
import storeApi from "../../API/store.api.js";
import useAddToCart from "../../hooks/cart/useAddToCart.js";
import useCategories from "../../hooks/categories/useCategories.js";
import useFeaturedProducts from "../../hooks/products/useFeaturedProducts.js";
import useStorefrontCatalogProducts from "../../hooks/products/useStorefrontCatalogProducts.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useTransientBusyState from "../../hooks/useTransientBusyState.js";
import { resolveAssetUrl, resolveStoreCoverUrl } from "../../utils/assetUrl.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
} from "../../utils/collections.js";
import { buildProductSnapshot } from "../../utils/guestCart.js";
import {
  isProductActive,
  isProductInStock,
  normalizeProductList,
} from "../../utils/products.js";
import { buildCategorySummary } from "../../utils/storefront.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./StoreDetails.css";

function buildStoreDescription(store) {
  return (
    String(store?.description || "").trim() ||
    String(store?.businessType || "").trim() ||
    "اكتشف منتجات المتجر وتصفح التصنيفات بسهولة."
  );
}

function buildCategoryProductGroups(products, categories) {
  const groups = categories.map((category) => ({
    ...category,
    groupId: String(category.id),
    products: [],
    count: 0,
    isVirtual: false,
  }));
  const groupsById = new Map(
    groups.map((group) => [String(group.id), group]),
  );
  const uncategorizedProducts = [];

  products.forEach((product) => {
    const matchingGroup = groupsById.get(String(product?.categoryId || ""));

    if (matchingGroup) {
      matchingGroup.products.push(product);
      matchingGroup.count += 1;
      return;
    }

    uncategorizedProducts.push(product);
  });

  const nonEmptyGroups = groups.filter((group) => group.products.length > 0);

  if (uncategorizedProducts.length) {
    nonEmptyGroups.push({
      id: "uncategorized",
      groupId: "uncategorized",
      name: "منتجات أخرى",
      description: "منتجات غير مرتبطة بفئة محددة.",
      products: uncategorizedProducts,
      count: uncategorizedProducts.length,
      isVirtual: true,
    });
  }

  return nonEmptyGroups;
}

export default function StoreDetails() {
  const { slug = "" } = useParams();
  const [searchText, setSearchText] = useState("");
  const [catalogView, setCatalogView] = useState("grid");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);
  const deferredSearchText = useDeferredValue(searchText);
  const recordedVisitRef = useRef("");
  const { isOwnerPreview, previewSearch, buildStorePreviewPath } =
    useOwnerStorePreview();

  const storeQuery = useStoreBySlug(slug);
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);

  const categoriesQuery = useCategories(store?.id, {
    enabled: Boolean(store?.id),
  });
  const featuredProductsQuery = useFeaturedProducts(store?.id, {
    enabled: Boolean(store?.id),
  });
  const categories = useMemo(
    () =>
      normalizeListResponse(categoriesQuery.data).filter(
        (category) => category?.id,
      ),
    [categoriesQuery.data],
  );
  const catalogProductsQuery = useStorefrontCatalogProducts(categories, {
    enabled: Boolean(store?.id),
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
  const keyword = deferredSearchText.toLowerCase().trim();
  const filteredProducts = useMemo(
    () =>
      keyword
        ? products.filter((product) =>
            [product.name, product.description, product.shortDescription]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(keyword)),
          )
        : products,
    [keyword, products],
  );
  const categorySummary = useMemo(
    () => buildCategorySummary(products, categories).slice(0, 8),
    [categories, products],
  );
  const catalogProductGroups = useMemo(
    () => buildCategoryProductGroups(filteredProducts, categories),
    [categories, filteredProducts],
  );
  const catalogProductGroupIds = useMemo(
    () => catalogProductGroups.map((group) => String(group.groupId || group.id)),
    [catalogProductGroups],
  );
  const availableProductsCount = useMemo(
    () => products.filter((product) => isProductInStock(product)).length,
    [products],
  );

  useEffect(() => {
    const storeId = String(store?.id || "").trim();

    if (!storeId || isOwnerPreview || recordedVisitRef.current === storeId) {
      return;
    }

    recordedVisitRef.current = storeId;
    storeApi.visitStore(storeId).catch(() => {
      // Ignore visit tracking errors on the public storefront.
    });
  }, [isOwnerPreview, store?.id]);

  useEffect(() => {
    setExpandedCategoryIds((currentIds) =>
      currentIds.filter((groupId) => catalogProductGroupIds.includes(groupId)),
    );
  }, [catalogProductGroupIds]);

  const handleAddToCart = (product) => {
    if (isOwnerPreview || !store?.id || !product?.id) {
      return;
    }

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

  const handleCategoryExpansion = (groupId) => (_, isExpanded) => {
    setExpandedCategoryIds((currentIds) =>
      isExpanded
        ? [...new Set([...currentIds, groupId])]
        : currentIds.filter((currentId) => currentId !== groupId),
    );
  };

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
  const resolvedStoreSlug = store.slug || slug;
  const storeDescription = buildStoreDescription(store);
  const shouldHideStoreHeader =
    String(store?.name || "").trim().toLowerCase() === "glamour";

  return (
    <Box className="storefront-page page-store-details">
      {addToCartMutation.isError ? (
        <Alert severity="error">تعذر إضافة المنتج إلى السلة.</Alert>
      ) : null}

      {addToCartMutation.isSuccess ? (
        <Alert severity="success">تمت إضافة المنتج إلى السلة.</Alert>
      ) : null}

      <SurfaceCard
        variant="hero"
        className="storefront-hero page-store-details__hero"
      >
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
                {!shouldHideStoreHeader ? (
                  <>
                    <Typography
                      variant="h1"
                      className="storefront-title page-store-details__title"
                    >
                      {store.name}
                    </Typography>
                    <Typography variant="body1" className="storefront-subtitle">
                      {storeDescription}
                    </Typography>
                  </>
                ) : null}

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {store.businessType ? (
                    <Chip label={store.businessType} variant="outlined" />
                  ) : null}
                  <Chip
                    label={store.isActive === false ? "غير نشط" : "نشط"}
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Box>

            <Box className="storefront-hero__metrics page-store-details__hero-metrics">
              <Box className="storefront-metric">
                <CategoryRoundedIcon fontSize="small" />
                <span className="storefront-metric__label">التصنيفات</span>
                <strong className="storefront-metric__value">
                  {categories.length}
                </strong>
              </Box>

              <Box className="storefront-metric">
                <StorefrontRoundedIcon fontSize="small" />
                <span className="storefront-metric__label">المنتجات</span>
                <strong className="storefront-metric__value">
                  {products.length}
                </strong>
              </Box>

              <Box className="storefront-metric">
                <Inventory2RoundedIcon fontSize="small" />
                <span className="storefront-metric__label">المتوفر الآن</span>
                <strong className="storefront-metric__value">
                  {availableProductsCount}
                </strong>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              <AppButton href="#store-catalog" variant="contained">
                تصفح الكتالوج
              </AppButton>
              <AppButton
                component={RouterLink}
                to={buildStorePreviewPath(`/market/${resolvedStoreSlug}/about`)}
                variant="text"
              >
                من نحن
              </AppButton>
              <AppButton
                component={RouterLink}
                to={buildStorePreviewPath(
                  `/market/${resolvedStoreSlug}/contact`,
                )}
                variant="text"
              >
                تواصل
              </AppButton>
              {isOwnerPreview ? (
                <AppButton
                  variant="outlined"
                  startIcon={<LocalMallRoundedIcon fontSize="small" />}
                  disabled
                >
                  السلة
                </AppButton>
              ) : (
                <AppButton
                  component={RouterLink}
                  to={buildStorePreviewPath(`/market/${resolvedStoreSlug}/cart`)}
                  variant="outlined"
                  startIcon={<LocalMallRoundedIcon fontSize="small" />}
                >
                  السلة
                </AppButton>
              )}
            </Stack>
          </Box>
        </Box>
      </SurfaceCard>

      <Box className="storefront-section">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">التصنيفات</span>
            <Typography variant="h3">التصنيفات الرئيسية</Typography>
          </Box>
        </Box>

        {categoriesQuery.isLoading && !categorySummary.length ? (
          <EmptyState title="جاري تحميل التصنيفات..." />
        ) : categorySummary.length ? (
          <Box className="storefront-cards-grid page-store-details__categories-grid">
            {categorySummary.map((category) => (
              <SurfaceCard
                key={category.id}
                component={RouterLink}
                to={buildStorePreviewPath(
                  `/market/${resolvedStoreSlug}/category/${category.id}`,
                )}
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

      <Box
        className="storefront-section page-store-details__featured"
        id="store-featured-products"
        data-scroll-section
      >
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">منتجات</span>
            <Typography variant="h3">منتجات مختارة</Typography>
          </Box>
        </Box>

        {featuredProductsQuery.isLoading && !featuredProducts.length ? (
          <EmptyState title="جاري تحميل المنتجات المختارة..." />
        ) : featuredProducts.length ? (
          <ProductGrid
            products={featuredProducts}
            storeSlug={resolvedStoreSlug}
            onAddToCart={handleAddToCart}
            addingProductId={addToCartUi.activeKey}
            disableCartActions={isOwnerPreview}
            linkSearch={previewSearch}
            scrollAnchorScope="store-featured-products"
          />
        ) : (
          <EmptyState title="لا توجد منتجات مختارة" />
        )}
      </Box>

      <Box
        className="storefront-section page-store-details__catalog"
        id="store-catalog"
        data-scroll-section
      >
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">المنتجات</span>
            <Typography variant="h3">جميع المنتجات</Typography>
          </Box>

          <Box className="page-store-details__catalog-toolbar">
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              className="page-store-details__view-toggle"
            >
              <AppButton
                variant={catalogView === "grid" ? "contained" : "outlined"}
                onClick={() => setCatalogView("grid")}
              >
                عرض شبكي
              </AppButton>
              <AppButton
                variant={catalogView === "grouped" ? "contained" : "outlined"}
                onClick={() => setCatalogView("grouped")}
              >
                حسب الفئات
              </AppButton>
            </Stack>

            <Box className="page-store-details__search">
              <SearchInput
                value={searchText}
                onChange={setSearchText}
                placeholder="ابحث داخل هذا المتجر"
              />
            </Box>
          </Box>
        </Box>

        <Box className="page-store-details__catalog-body">
          {catalogProductsQuery.isLoading ? (
            <EmptyState title="جاري تحميل المنتجات..." />
          ) : catalogProductsQuery.error ? (
            <EmptyState
              title="تعذر تحميل المنتجات"
              description="حاول تحديث الصفحة أو افتح المتجر مرة أخرى."
            />
          ) : filteredProducts.length ? (
            catalogView === "grouped" ? (
              <Box className="page-store-details__category-accordions">
                {catalogProductGroups.map((group) => {
                  const groupId = String(group.groupId || group.id);

                  return (
                    <Accordion
                      key={groupId}
                      expanded={expandedCategoryIds.includes(groupId)}
                      onChange={handleCategoryExpansion(groupId)}
                      disableGutters
                      className="page-store-details__category-accordion"
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreRoundedIcon />}
                        aria-controls={`store-category-panel-${groupId}`}
                        id={`store-category-header-${groupId}`}
                      >
                        <Box className="page-store-details__category-accordion-summary">
                          <Box className="page-store-details__category-accordion-copy">
                            <Typography variant="h6">{group.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {group.description || "استعرض منتجات هذه الفئة من هنا."}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            className="page-store-details__category-accordion-count"
                          >
                            {group.count} منتج
                          </Typography>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails>
                        {!group.isVirtual ? (
                          <Box className="page-store-details__category-accordion-actions">
                            <AppButton
                              component={RouterLink}
                              to={buildStorePreviewPath(
                                `/market/${resolvedStoreSlug}/category/${group.id}`,
                              )}
                              variant="text"
                            >
                              فتح صفحة الفئة
                            </AppButton>
                          </Box>
                        ) : null}

                        <ProductGrid
                          products={group.products}
                          storeSlug={resolvedStoreSlug}
                          onAddToCart={handleAddToCart}
                          addingProductId={addToCartUi.activeKey}
                          disableCartActions={isOwnerPreview}
                          linkSearch={previewSearch}
                          className="page-store-details__grouped-products-grid"
                          scrollAnchorScope={`store-category-${groupId}`}
                        />
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            ) : (
              <ProductGrid
                products={filteredProducts}
                storeSlug={resolvedStoreSlug}
                onAddToCart={handleAddToCart}
                addingProductId={addToCartUi.activeKey}
                disableCartActions={isOwnerPreview}
                linkSearch={previewSearch}
                scrollAnchorScope="store-catalog"
              />
            )
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
