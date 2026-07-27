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
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import ProductGrid, { ProductGridSkeleton } from "../../components/product/ProductGrid.jsx";
import ProductPagination from "../../components/product/ProductPagination.jsx";
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
  getProductDisplayVariant,
  getProductImage,
  isProductActive,
  isProductInStock,
  normalizeProductList,
} from "../../utils/products.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./StoreDetails.css";

const CATALOG_PAGE_SIZE = 12;

function buildStoreDescription(store) {
  return (
    String(store?.description || "").trim() ||
    String(store?.businessType || "").trim() ||
    "ط§ظƒطھط´ظپ ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…طھط¬ط± ظˆطھطµظپط­ ط§ظ„طھطµظ†ظٹظپط§طھ ط¨ط³ظ‡ظˆظ„ط©."
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
      name: "ظ…ظ†طھط¬ط§طھ ط£ط®ط±ظ‰",
      description: "ظ…ظ†طھط¬ط§طھ ط؛ظٹط± ظ…ط±طھط¨ط·ط© ط¨ظپط¦ط© ظ…ط­ط¯ط¯ط©.",
      products: uncategorizedProducts,
      count: uncategorizedProducts.length,
      isVirtual: true,
    });
  }

  return nonEmptyGroups;
}

function normalizeVisitCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export default function StoreDetails() {
  const { slug = "" } = useParams();
  const [searchText, setSearchText] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogView, setCatalogView] = useState("grid");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);
  const [recordedVisit, setRecordedVisit] = useState({
    storeId: "",
    count: null,
  });
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
  const catalogProductsQuery = useStorefrontCatalogProducts(store?.id, {
    enabled: Boolean(store?.id),
    params: {
      page: catalogPage,
      pageSize: CATALOG_PAGE_SIZE,
      search: deferredSearchText.trim() || undefined,
    },
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
  const filteredProducts = products;
  const categorySummary = useMemo(
    () => categories.slice(0, 8),
    [categories],
  );
  const catalogProductGroups = useMemo(
    () => buildCategoryProductGroups(filteredProducts, categories),
    [categories, filteredProducts],
  );
  const availableProductsCount = useMemo(
    () => products.filter((product) => isProductInStock(product)).length,
    [products],
  );
  const catalogPagination = catalogProductsQuery.pagination;
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

  const handleAddToCart = (product) => {
    if (isOwnerPreview || !store?.id || !product?.id) {
      return;
    }

    const defaultVariant = getProductDisplayVariant(product);

    addToCartUi.markBusy(product.id);
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      storeId: store.id,
      variantId: defaultVariant?.id || null,
      productSnapshot: buildProductSnapshot(product, {
        variant: defaultVariant,
      }),
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

  const handleCatalogPageChange = (nextPage) => {
    setCatalogPage(nextPage);

    if (typeof document !== "undefined") {
      document
        .getElementById("store-catalog")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSearchChange = (value) => {
    setSearchText(value);
    setCatalogPage(1);
  };

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-store-details">
        <EmptyState title="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…طھط¬ط±..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-store-details">
        <EmptyState
          title="طھط¹ط°ط± ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط§ظ„ظ…طھط¬ط±"
          description="ظ‚ط¯ ظٹظƒظˆظ† ط§ظ„ط±ط§ط¨ط· ط؛ظٹط± طµط­ظٹط­ ط£ظˆ ط£ظ† ط§ظ„ظ…طھط¬ط± ظ„ظ… ظٹط¹ط¯ ظ…طھط§ط­ظ‹ط§."
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
        <Alert severity="error">طھط¹ط°ط± ط¥ط¶ط§ظپط© ط§ظ„ظ…ظ†طھط¬ ط¥ظ„ظ‰ ط§ظ„ط³ظ„ط©.</Alert>
      ) : null}

      {addToCartMutation.isSuccess ? (
        <Alert severity="success">طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ظ…ظ†طھط¬ ط¥ظ„ظ‰ ط§ظ„ط³ظ„ط©.</Alert>
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
                  {store.name?.[0] || "ظ…"}
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
                    label={store.isActive === false ? "ط؛ظٹط± ظ†ط´ط·" : "ظ†ط´ط·"}
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Box>

            <Box className="storefront-hero__metrics page-store-details__hero-metrics">
              <Box className="storefront-metric">
                <CategoryRoundedIcon fontSize="small" />
                <span className="storefront-metric__label">ط§ظ„طھطµظ†ظٹظپط§طھ</span>
                <strong className="storefront-metric__value">
                  {categories.length}
                </strong>
              </Box>

              <Box className="storefront-metric">
                <StorefrontRoundedIcon fontSize="small" />
                <span className="storefront-metric__label">ط§ظ„ظ…ظ†طھط¬ط§طھ</span>
                <strong className="storefront-metric__value">
                  {(catalogPagination?.totalCount || products.length).toLocaleString("ar")}
                </strong>
              </Box>

              <Box className="storefront-metric">
                <Inventory2RoundedIcon fontSize="small" />
                <span className="storefront-metric__label">ط§ظ„ظ…طھظˆظپط± ط§ظ„ط¢ظ†</span>
                <strong className="storefront-metric__value">
                  {availableProductsCount}
                </strong>
              </Box>

              <Box className="storefront-metric">
                <VisibilityRoundedIcon fontSize="small" />
                <span className="storefront-metric__label">ط§ظ„ط²ظٹط§ط±ط§طھ</span>
                <strong className="storefront-metric__value">
                  {displayedVisitCount.toLocaleString("ar")}
                </strong>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              <AppButton href="#store-catalog" variant="contained">
                طھطµظپط­ ط§ظ„ظƒطھط§ظ„ظˆط¬
              </AppButton>
              <AppButton
                component={RouterLink}
                to={buildStorePreviewPath(`/market/${resolvedStoreSlug}/about`)}
                variant="text"
              >
                ظ…ظ† ظ†ط­ظ†
              </AppButton>
              <AppButton
                component={RouterLink}
                to={buildStorePreviewPath(
                  `/market/${resolvedStoreSlug}/contact`,
                )}
                variant="text"
              >
                طھظˆط§طµظ„
              </AppButton>
              {isOwnerPreview ? (
                <AppButton
                  variant="outlined"
                  startIcon={<LocalMallRoundedIcon fontSize="small" />}
                  disabled
                >
                  ط§ظ„ط³ظ„ط©
                </AppButton>
              ) : (
                <AppButton
                  component={RouterLink}
                  to={buildStorePreviewPath(`/market/${resolvedStoreSlug}/cart`)}
                  variant="outlined"
                  startIcon={<LocalMallRoundedIcon fontSize="small" />}
                >
                  ط§ظ„ط³ظ„ط©
                </AppButton>
              )}
            </Stack>
          </Box>
        </Box>
      </SurfaceCard>

      <Box className="storefront-section">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">ط§ظ„طھطµظ†ظٹظپط§طھ</span>
            <Typography variant="h3">ط§ظ„طھطµظ†ظٹظپط§طھ ط§ظ„ط±ط¦ظٹط³ظٹط©</Typography>
          </Box>
        </Box>

        {categoriesQuery.isLoading && !categorySummary.length ? (
          <EmptyState title="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„طھطµظ†ظٹظپط§طھ..." />
        ) : categorySummary.length ? (
          <Box className="storefront-cards-grid page-store-details__categories-grid">

            {categorySummary.map((category) => {
              const categoryProductImage = resolveAssetUrl(
                getProductImage(
                  [...featuredProducts, ...products].find(
                    (product) => String(product?.categoryId || "") === String(category.id),
                  ),
                ),
              );
              const categoryImage = categoryProductImage || coverImage || "";

              return (
                <SurfaceCard
                  key={category.id}
                  component={RouterLink}
                  to={buildStorePreviewPath(
                    `/market/${resolvedStoreSlug}/category/${category.id}`,
                  )}
                  interactive
                  className="page-store-details__category-card"
                  style={
                    categoryImage
                      ? { "--category-card-image": `url("${categoryImage}")` }
                      : undefined
                  }
                >
                  <Typography variant="h6">{category.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.description || ""}
                  </Typography>
                  {category.count !== undefined ? (
                    <Typography variant="caption" color="text.secondary">
                      {category.count} منتج
                    </Typography>
                  ) : null}
                </SurfaceCard>
              );
            })}
          </Box>
        ) : (
          <EmptyState
            title="ظ„ط§ طھظˆط¬ط¯ طھطµظ†ظٹظپط§طھ ط¨ط¹ط¯"
            description="ط³طھط¸ظ‡ط± ط§ظ„طھطµظ†ظٹظپط§طھ ظ‡ظ†ط§ ط¨ظ…ط¬ط±ط¯ ط¥ط¶ط§ظپط© ط£ظ‚ط³ط§ظ… ظˆظ…ظ†طھط¬ط§طھ ط¯ط§ط®ظ„ ط§ظ„ظ…طھط¬ط±."
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
            <span className="storefront-eyebrow">ظ…ظ†طھط¬ط§طھ</span>
            <Typography variant="h3">ظ…ظ†طھط¬ط§طھ ظ…ط®طھط§ط±ط©</Typography>
          </Box>
        </Box>

        {featuredProductsQuery.isLoading && !featuredProducts.length ? (
          <ProductGridSkeleton count={5} />
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
          <EmptyState title="ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ ظ…ط®طھط§ط±ط©" />
        )}
      </Box>

      <Box
        className="storefront-section page-store-details__catalog"
        id="store-catalog"
        data-scroll-section
      >
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">ط§ظ„ظ…ظ†طھط¬ط§طھ</span>
            <Typography variant="h3">ط¬ظ…ظٹط¹ ط§ظ„ظ…ظ†طھط¬ط§طھ</Typography>
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
                ط¹ط±ط¶ ط´ط¨ظƒظٹ
              </AppButton>
              <AppButton
                variant={catalogView === "grouped" ? "contained" : "outlined"}
                onClick={() => setCatalogView("grouped")}
              >
                ط­ط³ط¨ ط§ظ„ظپط¦ط§طھ
              </AppButton>
            </Stack>

            <Box className="page-store-details__search">
              <SearchInput
                value={searchText}
                onChange={handleSearchChange}
                placeholder="ط§ط¨ط­ط« ط¯ط§ط®ظ„ ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±"
              />
            </Box>
          </Box>
        </Box>

        <Box className="page-store-details__catalog-body">
          {catalogProductsQuery.isLoading ? (
            <ProductGridSkeleton
              count={CATALOG_PAGE_SIZE}
              className={
                catalogView === "grouped"
                  ? "page-store-details__grouped-products-grid"
                  : ""
              }
            />
          ) : catalogProductsQuery.error ? (
            <EmptyState
              title="طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ"
              description="ط­ط§ظˆظ„ طھط­ط¯ظٹط« ط§ظ„طµظپط­ط© ط£ظˆ ط§ظپطھط­ ط§ظ„ظ…طھط¬ط± ظ…ط±ط© ط£ط®ط±ظ‰."
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
                              {group.description || "ط§ط³طھط¹ط±ط¶ ظ…ظ†طھط¬ط§طھ ظ‡ط°ظ‡ ط§ظ„ظپط¦ط© ظ…ظ† ظ‡ظ†ط§."}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            className="page-store-details__category-accordion-count"
                          >
                            {group.count} ظ…ظ†طھط¬
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
                              ظپطھط­ طµظپط­ط© ط§ظ„ظپط¦ط©
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
                <ProductPagination
                  pagination={catalogPagination}
                  onPageChange={handleCatalogPageChange}
                />
              </Box>
            ) : (
              <>
                <ProductGrid
                  products={filteredProducts}
                  storeSlug={resolvedStoreSlug}
                  onAddToCart={handleAddToCart}
                  addingProductId={addToCartUi.activeKey}
                  disableCartActions={isOwnerPreview}
                  linkSearch={previewSearch}
                  scrollAnchorScope="store-catalog"
                />
                <ProductPagination
                  pagination={catalogPagination}
                  onPageChange={handleCatalogPageChange}
                />
              </>
            )
          ) : (
            <EmptyState
              title="ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬"
              description="ط¬ط±ظ‘ط¨ ظƒظ„ظ…ط© ط¨ط­ط« ط£ط®ط±ظ‰ ط£ظˆ ط§ط±ط¬ط¹ ط¥ظ„ظ‰ ط¬ظ…ظٹط¹ ط§ظ„طھطµظ†ظٹظپط§طھ."
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

