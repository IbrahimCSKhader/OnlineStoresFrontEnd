import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
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
import useProducts from "../../hooks/products/useProducts.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
} from "../../utils/collections.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { buildProductSnapshot } from "../../utils/guestCart.js";
import {
  getProductComparePrice,
  getProductDisplayPrice,
} from "../../utils/storefront.js";
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

export default function ProductDetails() {
  const { slug, productId } = useParams();
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
    () => normalizeEntityResponse(productQuery.data),
    [productQuery.data],
  );

  useStoreBranding(store);

  const relatedProductsQuery = useProducts(store?.id, undefined, {
    enabled: Boolean(store?.id),
  });

  const effectiveStoreId = store?.id || product?.storeId;
  const addToCartMutation = useAddToCart(effectiveStoreId);

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
    variants.find((item) => item.id === selectedVariantId) || null;
  const productDisplayPrice = getProductDisplayPrice(product);
  const displayPrice = selectedVariant?.priceOverride ?? productDisplayPrice;
  const comparePrice =
    selectedVariant?.priceOverride === undefined ||
    selectedVariant?.priceOverride === null
      ? getProductComparePrice(product)
      : 0;
  const hasComparePrice = comparePrice > Number(displayPrice);
  const attributes = product?.attributeValues || [];
  const storeMismatch =
    Boolean(store?.id) &&
    Boolean(product?.storeId) &&
    store.id !== product.storeId;

  const relatedProducts = useMemo(
    () =>
      normalizeListResponse(relatedProductsQuery.data)
        .filter((item) => item.id !== product?.id)
        .slice(0, 4),
    [product?.id, relatedProductsQuery.data],
  );

  useEffect(() => {
    if (!productId) return;

    productApi.visitProduct(productId).catch(() => {
      // Ignore visit-count failures on the public page.
    });
  }, [productId]);

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
    if (!effectiveStoreId || !product?.id) return;

    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      storeId: effectiveStoreId,
      variantId: selectedVariantId || null,
      productSnapshot: buildProductSnapshot(product, { variant: selectedVariant }),
    });
  };

  if (storeQuery.isLoading || productQuery.isLoading) {
    return (
      <Box className="storefront-page page-product-details">
        <EmptyState title="جاري تجهيز صفحة المنتج..." />
      </Box>
    );
  }

  if (storeQuery.error || productQuery.error || !store || !product || storeMismatch) {
    return (
      <Box className="storefront-page page-product-details">
        <EmptyState
          title="تعذر عرض المنتج"
          description="ربما لم يعد هذا المنتج متاحًا أو أن الرابط غير صحيح."
          action={
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
              <AppButton
                component={RouterLink}
                to={slug ? `/market/${slug}` : "/market"}
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
            <span className="storefront-eyebrow">Product details</span>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              className="page-product-details__crumbs"
            >
              <AppButton component={RouterLink} to={`/market/${slug}`} variant="text">
                {store.name}
              </AppButton>
              {product.categoryId ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    /
                  </Typography>
                  <AppButton
                    component={RouterLink}
                    to={`/market/${slug}/category/${product.categoryId}`}
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
              to={`/market/${slug}`}
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon fontSize="small" />}
            >
              العودة إلى المتجر
            </AppButton>
            <AppButton component={RouterLink} to={`/market/${slug}/cart`} variant="text">
              السلة
            </AppButton>
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
                  {product.shortDescription ||
                    product.description ||
                    "لا يوجد وصف لهذا المنتج بعد."}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip icon={<StorefrontRoundedIcon />} label={store.name} />
                {product.categoryName ? (
                  <Chip
                    component={RouterLink}
                    to={`/market/${slug}/category/${product.categoryId}`}
                    clickable
                    label={product.categoryName}
                    variant="outlined"
                  />
                ) : null}
                {product.sectionName ? <Chip label={product.sectionName} variant="outlined" /> : null}
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

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  icon={<Inventory2RoundedIcon fontSize="small" />}
                  label={`المتوفر: ${selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0}`}
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
                onChange={(variantId) => updateUiState({ selectedVariantId: variantId })}
              />

              <Box className="page-product-details__purchase">
                <Typography variant="subtitle1" className="page-product-details__block-title">
                  الكمية
                </Typography>

                <QuantityStepper
                  value={quantity}
                  min={1}
                  max={selectedVariant?.stockQuantity ?? product.stockQuantity}
                  onChange={(nextValue) => updateUiState({ quantity: nextValue })}
                />

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <AppButton
                    variant="contained"
                    loading={addToCartMutation.isPending}
                    onClick={handleAddToCart}
                    startIcon={<LocalMallRoundedIcon fontSize="small" />}
                    sx={{ minWidth: { xs: "100%", sm: 220 } }}
                  >
                    أضف إلى السلة
                  </AppButton>
                  <AppButton
                    component={RouterLink}
                    to={`/market/${slug}/checkout`}
                    variant="outlined"
                  >
                    اذهب إلى الدفع
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

      <Box className="storefront-section">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">Related products</span>
            <Typography variant="h3">قد يعجبك أيضًا</Typography>
          </Box>
        </Box>

        {relatedProducts.length ? (
          <ProductGrid
            products={relatedProducts}
            storeSlug={store.slug}
            onAddToCart={(relatedProduct) =>
              addToCartMutation.mutate({
                productId: relatedProduct.id,
                quantity: 1,
                storeId: effectiveStoreId,
                variantId: null,
                productSnapshot: buildProductSnapshot(relatedProduct),
              })
            }
            addingProductId={addToCartMutation.variables?.productId}
          />
        ) : (
          <EmptyState
            title="لا توجد منتجات مرتبطة حاليًا"
            description="عند توفر منتجات إضافية في المتجر ستظهر هنا تلقائيًا."
          />
        )}
      </Box>
    </Box>
  );
}
