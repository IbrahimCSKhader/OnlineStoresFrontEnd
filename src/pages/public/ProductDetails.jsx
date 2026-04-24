import { useEffect, useMemo, useState } from "react";
import {
  Link as RouterLink,
  matchPath,
  useLocation,
  useParams,
} from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import productApi from "../../API/product.api.js";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import QuantityStepper from "../../components/common/inputs/QuantityStepper.jsx";
import ProductGallery from "../../components/product/ProductGallery.jsx";
import ProductGrid from "../../components/product/ProductGrid.jsx";
import ProductVariantPicker from "../../components/product/ProductVariantPicker.jsx";
import useAddToCart from "../../hooks/cart/useAddToCart.js";
import useProductDetails from "../../hooks/products/useProductDetails.js";
import useProductsByCategory from "../../hooks/products/useProductsByCategory.js";
import useProductsBySection from "../../hooks/products/useProductsBySection.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useTransientBusyState from "../../hooks/useTransientBusyState.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { buildProductSnapshot } from "../../utils/guestCart.js";
import {
  getProductComparePrice,
  getProductDisplayPrice,
  getProductOriginalPrice,
  isProductActive,
  isProductInStock,
  normalizeProductDto,
  normalizeProductList,
} from "../../utils/products.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./ProductDetails.css";

function getProductImages(product) {
  const images = Array.isArray(product?.images) ? product.images : [];

  if (images.length) {
    return images;
  }

  if (product?.thumbnailUrl) {
    return [
      {
        id: "thumbnail",
        url: product.thumbnailUrl,
        altText: product.name,
      },
    ];
  }

  return [];
}

function getPathnameFromReturnTo(returnTo = "") {
  if (!returnTo) {
    return "";
  }

  const [pathname] = String(returnTo).split("?");
  return pathname || "";
}

function isCatalogReturnTarget(returnTo = "") {
  const pathname = getPathnameFromReturnTo(returnTo);

  return Boolean(
    matchPath("/market/:slug", pathname) ||
      matchPath("/market/:slug/category/:categoryId", pathname),
  );
}

export default function ProductDetails() {
  const { slug, productId } = useParams();
  const location = useLocation();
  const { isOwnerPreview, previewSearch, buildStorePreviewPath } =
    useOwnerStorePreview();
  const [uiState, setUiState] = useState({
    productId: "",
    selectedImageIndex: 0,
    quantity: 1,
    selectedVariantId: "",
  });

  const storeQuery = useStoreBySlug(slug);
  const productQuery = useProductDetails(productId, {
    enabled: Boolean(productId),
  });

  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );
  const product = useMemo(
    () => normalizeProductDto(productQuery.data),
    [productQuery.data],
  );
  const isPublicProduct = isProductActive(product);

  useStoreBranding(store);

  const relatedByCategoryQuery = useProductsByCategory(product?.categoryId, {
    enabled: Boolean(product?.categoryId) && isPublicProduct,
  });
  const relatedBySectionQuery = useProductsBySection(product?.sectionId, {
    enabled: Boolean(product?.sectionId) && !product?.categoryId && isPublicProduct,
  });

  const effectiveStoreId = store?.id || product?.storeId;
  const addToCartMutation = useAddToCart(effectiveStoreId);
  const addToCartUi = useTransientBusyState();
  const relatedAddToCartUi = useTransientBusyState();

  const images = useMemo(() => getProductImages(product), [product]);
  const variants = product?.variants || [];
  const selectedImageIndex =
    uiState.productId === product?.id ? uiState.selectedImageIndex : 0;
  const quantity = uiState.productId === product?.id ? uiState.quantity : 1;
  const selectedVariantId =
    uiState.productId === product?.id
      ? uiState.selectedVariantId
      : variants[0]?.id || "";
  const selectedVariant =
    variants.find((item) => String(item.id) === String(selectedVariantId)) || null;
  const isVariantPriceApplied =
    selectedVariant?.priceOverride !== undefined &&
    selectedVariant?.priceOverride !== null;
  const productDisplayPrice = getProductDisplayPrice(product);
  const displayPrice = isVariantPriceApplied
    ? Number(selectedVariant.priceOverride)
    : productDisplayPrice;
  const comparePrice = isVariantPriceApplied ? 0 : getProductComparePrice(product);
  const originalPrice = isVariantPriceApplied ? 0 : getProductOriginalPrice(product);
  const hasComparePrice = comparePrice > Number(displayPrice);
  const hasOriginalPrice =
    originalPrice > Number(displayPrice) && originalPrice !== comparePrice;
  const attributes = product?.attributeValues || [];
  const isAvailable = isProductInStock(product, selectedVariant);
  const availableStock = selectedVariant
    ? Number(selectedVariant.stockQuantity ?? 0)
    : Number(product.stockQuantity ?? 0);
  const quantityMax = product.trackInventory
    ? selectedVariant?.stockQuantity ?? product.stockQuantity
    : undefined;
  const storeMismatch =
    Boolean(store?.id) &&
    Boolean(product?.storeId) &&
    String(store.id) !== String(product.storeId);
  const currentProductId = product?.id || "";

  const relatedSource = product?.categoryId
    ? relatedByCategoryQuery.data
    : relatedBySectionQuery.data;
  const relatedProducts = useMemo(
    () =>
      normalizeProductList(relatedSource)
        .filter(
          (item) => isProductActive(item) && String(item.id) !== String(currentProductId),
        )
        .slice(0, 4),
    [currentProductId, relatedSource],
  );
  const relatedProductsLoading = product?.categoryId
    ? relatedByCategoryQuery.isLoading
    : relatedBySectionQuery.isLoading;
  const productShareUrl = useMemo(() => {
    if (!store?.slug || !product?.id) {
      return "";
    }

    const pathname = `/market/${store.slug}/product/${product.id}`;
    return typeof window === "undefined"
      ? pathname
      : new URL(pathname, window.location.origin).toString();
  }, [product?.id, store?.slug]);
  const requestedReturnTo =
    typeof location.state?.returnTo === "string" ? location.state.returnTo : "";
  const hasCatalogReturnTarget = isCatalogReturnTarget(requestedReturnTo);
  const backTarget = hasCatalogReturnTarget
    ? requestedReturnTo
    : buildStorePreviewPath(`/market/${slug}`);
  const backTargetState =
    hasCatalogReturnTarget &&
    typeof location.state?.scrollRestoreKey === "string" &&
    location.state.scrollRestoreKey
      ? {
          restoreScroll: true,
          scrollRestoreKey: location.state.scrollRestoreKey,
        }
      : undefined;

  useEffect(() => {
    if (!productId || !isPublicProduct || storeMismatch) {
      return;
    }

    productApi.visitProduct(productId).catch(() => {
      // Ignore visit-count failures on the public page.
    });
  }, [isPublicProduct, productId, storeMismatch]);

  const updateUiState = (updates) => {
    if (!product?.id) return;

    setUiState((previous) => {
      const baseState =
        previous.productId === product.id
          ? previous
          : {
              productId: product.id,
              selectedImageIndex: 0,
              quantity: 1,
              selectedVariantId: variants[0]?.id || "",
            };

      return {
        ...baseState,
        ...updates,
        productId: product.id,
      };
    });
  };

  const handleAddToCart = () => {
    if (isOwnerPreview || !effectiveStoreId || !product?.id || !isAvailable) {
      return;
    }

    addToCartUi.markBusy("main");
    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      storeId: effectiveStoreId,
      variantId: selectedVariantId || null,
      productSnapshot: buildProductSnapshot(product, { variant: selectedVariant }),
      debugSource: "product-details-page-main",
    });
  };

  const handleRelatedAddToCart = (relatedProduct) => {
    if (isOwnerPreview || !effectiveStoreId || !relatedProduct?.id) return;

    relatedAddToCartUi.markBusy(relatedProduct.id);
    addToCartMutation.mutate({
      productId: relatedProduct.id,
      quantity: 1,
      storeId: effectiveStoreId,
      variantId: null,
      productSnapshot: buildProductSnapshot(relatedProduct),
      debugSource: "product-details-page-related",
    });
  };

  const handleCopyProductLink = async () => {
    if (!productShareUrl) {
      window.alert("تعذر تجهيز رابط المنتج الآن.");
      return;
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("clipboard-unavailable");
      }

      await navigator.clipboard.writeText(productShareUrl);
      window.alert("تم نسخ رابط المنتج.");
    } catch {
      window.alert("تعذر نسخ الرابط الآن.");
    }
  };

  const handleShareProduct = async () => {
    if (!productShareUrl) {
      window.alert("تعذر تجهيز رابط المنتج الآن.");
      return;
    }

    try {
      if (navigator?.share) {
        await navigator.share({
          title: product?.name || "المنتج",
          text: product?.shortDescription || product?.name || "",
          url: productShareUrl,
        });
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }

    await handleCopyProductLink();
  };

  if (storeQuery.isLoading || productQuery.isLoading) {
    return (
      <Box className="storefront-page page-product-details">
        <EmptyState title="جارٍ التحميل..." />
      </Box>
    );
  }

  if (storeQuery.error || productQuery.error || !store || !product || storeMismatch || !isPublicProduct) {
    return (
      <Box className="storefront-page page-product-details">
        <EmptyState
          title="تعذر عرض المنتج"
          description="ربما لم يعد هذا المنتج متاحًا أو أن الرابط غير صحيح."
          action={
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
              <AppButton
                component={RouterLink}
                to={backTarget}
                state={backTargetState}
                variant="contained"
              >
                العودة إلى المتجر
              </AppButton>
            </Stack>
          }
        />
      </Box>
    );
  }

  return (
    <Box className="storefront-page page-product-details">
      {addToCartMutation.isError ? (
        <Alert severity="error">تعذر إضافة المنتج إلى السلة. حاول مرة أخرى.</Alert>
      ) : null}

      {addToCartMutation.isSuccess ? (
        <Alert severity="success">تمت إضافة المنتج إلى السلة.</Alert>
      ) : null}

      <SurfaceCard variant="hero" className="page-product-details__hero">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">المنتج</span>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              className="page-product-details__crumbs"
            >
              <AppButton
                component={RouterLink}
                to={backTarget}
                state={backTargetState}
                variant="text"
              >
                {store.name}
              </AppButton>
              {product.categoryId ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    /
                  </Typography>
                  <AppButton
                    component={RouterLink}
                    to={buildStorePreviewPath(
                      `/market/${slug}/category/${product.categoryId}`,
                    )}
                    variant="text"
                  >
                    {product.categoryName || "التصنيف"}
                  </AppButton>
                </>
              ) : null}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <AppButton
              component={RouterLink}
              to={backTarget}
              state={backTargetState}
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon fontSize="small" />}
            >
              العودة إلى المتجر
            </AppButton>
            {isOwnerPreview ? (
              <AppButton variant="text" disabled>
                السلة
              </AppButton>
            ) : (
              <AppButton
                component={RouterLink}
                to={buildStorePreviewPath(`/market/${slug}/cart`)}
                variant="text"
              >
                السلة
              </AppButton>
            )}
          </Stack>
        </Box>
      </SurfaceCard>

      <Box className="storefront-grid page-product-details__layout">
        <Box className="storefront-grid__span-5 page-product-details__gallery-wrap">
          <SurfaceCard className="page-product-details__gallery-card">
            <ProductGallery
              images={images}
              productName={product.name}
              selectedImageIndex={selectedImageIndex}
              onSelectImage={(index) => updateUiState({ selectedImageIndex: index })}
            />
          </SurfaceCard>
        </Box>

        <Box className="storefront-grid__span-7 page-product-details__content-wrap">
          <SurfaceCard className="page-product-details__content-card">
            <Stack spacing={2}>
              <Box className="storefront-stack">
                <Typography variant="h2" className="page-product-details__title">
                  {product.name}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  className="page-product-details__lead"
                >
                  {product.shortDescription || product.description || ""}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip icon={<StorefrontRoundedIcon />} label={store.name} />
                {product.categoryName ? (
                  <Chip
                    component={RouterLink}
                    to={buildStorePreviewPath(
                      `/market/${slug}/category/${product.categoryId}`,
                    )}
                    clickable
                    label={product.categoryName}
                    variant="outlined"
                  />
                ) : null}
                {product.sectionName ? <Chip label={product.sectionName} variant="outlined" /> : null}
                {product.hasDiscount ? (
                  <Chip
                    label={
                      product.discountPercentage > 0
                        ? `خصم ${Math.round(product.discountPercentage)}%`
                        : "عرض متاح"
                    }
                    color="warning"
                    variant="outlined"
                  />
                ) : null}
                {product.isWholesalePriceApplied ? (
                  <Chip label="تم تطبيق سعر العميل" color="success" variant="outlined" />
                ) : null}
              </Stack>

              <Box className="page-product-details__price-wrap">
                <Typography variant="h3" className="page-product-details__price">
                  {formatCurrency(displayPrice)}
                </Typography>
                {hasComparePrice ? (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    className="page-product-details__compare"
                  >
                    {formatCurrency(comparePrice)}
                  </Typography>
                ) : null}
              </Box>

              {hasOriginalPrice ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="page-product-details__price-note"
                >
                  السعر قبل خصم العميل: {formatCurrency(originalPrice)}
                </Typography>
              ) : null}

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  icon={<Inventory2RoundedIcon fontSize="small" />}
                  label={
                    isAvailable
                      ? product.trackInventory && availableStock > 0
                        ? `المتوفر: ${availableStock}`
                        : "متوفر الآن"
                      : "غير متوفر حالياً"
                  }
                  color={isAvailable ? "default" : "warning"}
                  variant="outlined"
                />
                <Chip
                  icon={<VisibilityRoundedIcon fontSize="small" />}
                  label={`${product.visitCount ?? 0} زيارة`}
                  variant="outlined"
                />
              </Stack>

              <Divider />

              <ProductVariantPicker
                variants={variants}
                selectedVariantId={selectedVariantId}
                onChange={(variantId) => updateUiState({ selectedVariantId: variantId, quantity: 1 })}
              />

              <Box className="page-product-details__purchase">
                <Typography variant="subtitle1" className="page-product-details__block-title">
                  الكمية
                </Typography>

                <QuantityStepper
                  value={quantity}
                  min={1}
                  max={quantityMax}
                  disabled={isOwnerPreview}
                  onChange={(nextValue) => updateUiState({ quantity: nextValue })}
                />

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <AppButton
                    variant="contained"
                    loading={addToCartUi.activeKey === "main"}
                    loadingLabel="جارٍ الإضافة"
                    onClick={handleAddToCart}
                    startIcon={<LocalMallRoundedIcon fontSize="small" />}
                    sx={{ minWidth: { xs: "100%", sm: 220 } }}
                    disabled={isOwnerPreview || !isAvailable}
                  >
                    أضف إلى السلة
                  </AppButton>
                  {isOwnerPreview ? (
                    <AppButton variant="outlined" disabled>
                      اذهب إلى الدفع
                    </AppButton>
                  ) : (
                    <AppButton
                      component={RouterLink}
                      to={buildStorePreviewPath(`/market/${slug}/checkout`)}
                      variant="outlined"
                      disabled={!isAvailable}
                    >
                      اذهب إلى الدفع
                    </AppButton>
                  )}
                  <AppButton variant="outlined" onClick={handleCopyProductLink}>
                    نسخ الرابط
                  </AppButton>
                  <AppButton variant="text" onClick={handleShareProduct}>
                    مشاركة
                  </AppButton>
                </Stack>
              </Box>

              {product.description && product.description !== product.shortDescription ? (
                <>
                  <Divider />
                  <Box className="page-product-details__description">
                    <Typography variant="subtitle1" className="page-product-details__block-title">
                      وصف المنتج
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {product.description}
                    </Typography>
                  </Box>
                </>
              ) : null}

              {attributes.length ? (
                <>
                  <Divider />
                  <Box className="page-product-details__attributes">
                    <Typography variant="subtitle1" className="page-product-details__block-title">
                      المواصفات
                    </Typography>
                    <Box className="page-product-details__attribute-list">
                      {attributes.map((item) => (
                        <Box
                          key={item.id ?? `${item.attributeName}-${item.value}`}
                          className="page-product-details__attribute-item"
                        >
                          <Typography variant="body2" color="text.secondary">
                            {item.attributeName || "معلومة"}
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {item.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </>
              ) : null}
            </Stack>
          </SurfaceCard>
        </Box>
      </Box>

      <Box
        className="storefront-section"
        id="related-products"
        data-scroll-section
      >
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">منتجات</span>
            <Typography variant="h3">منتجات مشابهة</Typography>
          </Box>
        </Box>

        {relatedProductsLoading ? (
          <EmptyState title="جارٍ تحميل المنتجات المشابهة..." />
        ) : relatedProducts.length ? (
          <ProductGrid
            products={relatedProducts}
            storeSlug={store.slug}
            onAddToCart={handleRelatedAddToCart}
            addingProductId={relatedAddToCartUi.activeKey}
            disableCartActions={isOwnerPreview}
            linkSearch={previewSearch}
            scrollAnchorScope="related-products"
          />
        ) : (
          <EmptyState title="لا توجد منتجات مشابهة" />
        )}
      </Box>
    </Box>
  );
}
