import { useDeferredValue, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import ProductGrid from "../../components/product/ProductGrid.jsx";
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
  normalizeProductList,
} from "../../utils/products.js";
import { buildCategorySummary } from "../../utils/storefront.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./StoreDetails.css";

export default function StoreDetails() {
  const { slug } = useParams();
  const [searchText, setSearchText] = useState("");
  const { isOwnerPreview, previewSearch, buildStorePreviewPath } =
    useOwnerStorePreview();
  const deferredSearchText = useDeferredValue(searchText);
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

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-store-details">
        <EmptyState title="ط¬ط§ط±ظچ طھط­ظ…ظٹظ„ ط§ظ„ظ…طھط¬ط±..." />
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
  const products = catalogProductsQuery.data;
  const keyword = deferredSearchText.toLowerCase().trim();
  const filteredProducts = keyword
    ? products.filter((product) =>
        [
          product.name,
          product.description,
          product.shortDescription,
          product.slug,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword)),
      )
    : products;

  const categorySummary = buildCategorySummary(products, categories).slice(0, 8);

  const handleAddToCart = (product) => {
    if (isOwnerPreview || !store?.id || !product?.id) return;

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
            <span className="storefront-eyebrow">ط§ظ„ظ…طھط¬ط±</span>

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
                <Typography
                  variant="h1"
                  className="storefront-title page-store-details__title"
                >
                  {store.name}
                </Typography>
                <Typography variant="body1" className="storefront-subtitle">
                  {store.description || ""}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              <AppButton href="#store-catalog" variant="contained">
                طھطµظپط­ ط§ظ„ظƒطھط§ظ„ظˆط¬
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
                  to={buildStorePreviewPath(`/market/${store.slug}/cart`)}
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
            <span className="storefront-eyebrow">Categories</span>
            <Typography variant="h3">ط§ظ„طھطµظ†ظٹظپط§طھ ط§ظ„ط±ط¦ظٹط³ظٹط©</Typography>
          </Box>
        </Box>

        {categoriesQuery.isLoading && !categorySummary.length ? (
          <EmptyState title="ط¬ط§ط±ظچ طھط­ظ…ظٹظ„ ط§ظ„طھطµظ†ظٹظپط§طھ..." />
        ) : categorySummary.length ? (
          <Box className="storefront-cards-grid page-store-details__categories-grid">
            {categorySummary.map((category) => (
              <SurfaceCard
                key={category.id}
                component={RouterLink}
                to={buildStorePreviewPath(
                  `/market/${store.slug}/category/${category.id}`,
                )}
                interactive
                className="page-store-details__category-card"
              >
                <Typography variant="h6">{category.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.description || ""}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {category.count} ظ…ظ†طھط¬
                </Typography>
              </SurfaceCard>
            ))}
          </Box>
        ) : (
          <EmptyState
            title="ظ„ط§ طھظˆط¬ط¯ طھطµظ†ظٹظپط§طھ ط¨ط¹ط¯"
            description="ط³طھط¸ظ‡ط± ط§ظ„طھطµظ†ظٹظپط§طھ ظ‡ظ†ط§ ط¨ظ…ط¬ط±ط¯ ط¥ط¶ط§ظپط© ط£ظ‚ط³ط§ظ… ظˆظ…ظ†طھط¬ط§طھ ط¯ط§ط®ظ„ ط§ظ„ظ…طھط¬ط±."
          />
        )}
      </Box>

      <Box className="storefront-section page-store-details__featured">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">ظ…ظ†طھط¬ط§طھ</span>
            <Typography variant="h3">ظ…ظ†طھط¬ط§طھ ظ…ط®طھط§ط±ط©</Typography>
          </Box>
        </Box>

        {featuredProductsQuery.isLoading && !featuredProducts.length ? (
          <EmptyState title="ط¬ط§ط±ظچ طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…ط®طھط§ط±ط©..." />
        ) : featuredProducts.length ? (
          <ProductGrid
            products={featuredProducts}
            storeSlug={store.slug}
            onAddToCart={handleAddToCart}
            addingProductId={addToCartUi.activeKey}
            disableCartActions={isOwnerPreview}
            linkSearch={previewSearch}
          />
        ) : (
          <EmptyState title="ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ ظ…ط®طھط§ط±ط©" />
        )}
      </Box>

      <Box
        className="storefront-section page-store-details__catalog"
        id="store-catalog"
      >
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">ط§ظ„ظ…ظ†طھط¬ط§طھ</span>
            <Typography variant="h3">ط¬ظ…ظٹط¹ ط§ظ„ظ…ظ†طھط¬ط§طھ</Typography>
          </Box>

          <Box className="page-store-details__search">
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="ط§ط¨ط­ط« ط¯ط§ط®ظ„ ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±"
            />
          </Box>
        </Box>

        <Box className="page-store-details__catalog-body">
          {catalogProductsQuery.isLoading ? (
            <EmptyState title="ط¬ط§ط±ظچ طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ..." />
          ) : filteredProducts.length ? (
            <ProductGrid
              products={filteredProducts}
              storeSlug={store.slug}
              onAddToCart={handleAddToCart}
              addingProductId={addToCartUi.activeKey}
              disableCartActions={isOwnerPreview}
              linkSearch={previewSearch}
            />
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
