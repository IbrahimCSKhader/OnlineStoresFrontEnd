import { memo } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import AppButton from "../common/buttons/AppButton.jsx";
import SurfaceCard from "../common/cards/SurfaceCard.jsx";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import {
  getProductComparePrice,
  getProductDisplayPrice,
  getProductDisplayVariant,
  getProductImage,
  getProductOriginalPrice,
  isProductInStock,
  normalizeProductDto,
} from "../../utils/products.js";
import {
  buildProductScrollAnchorId,
  buildScrollRestoreKey,
  captureElementScrollSnapshot,
} from "../../utils/scrollRestoration.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import "./ProductCard.css";

function ProductCard({
  product,
  storeSlug,
  onAddToCart,
  adding,
  disableCartActions = false,
  linkSearch = "",
  scrollAnchorScope = "products",
  scrollAnchorIndex = 0,
}) {
  const location = useLocation();
  const normalizedProduct = normalizeProductDto(product);
  const displayVariant = getProductDisplayVariant(normalizedProduct);
  const image = resolveAssetUrl(getProductImage(normalizedProduct));
  const price = getProductDisplayPrice(normalizedProduct);
  const comparePrice = getProductComparePrice(normalizedProduct);
  const originalPrice = getProductOriginalPrice(normalizedProduct);
  const hasComparePrice = comparePrice > price;
  const hasOriginalPrice = originalPrice > price && originalPrice !== comparePrice;
  const isAvailable = isProductInStock(normalizedProduct);
  const resolvedStoreSlug = storeSlug || normalizedProduct.storeSlug;
  const detailPath =
    resolvedStoreSlug && normalizedProduct.id
      ? buildStorefrontPath(resolvedStoreSlug, `/product/${normalizedProduct.id}`)
      : "";
  const currentSearch = location.search || "";
  const returnSearch = currentSearch || linkSearch || "";
  const detailSearch = linkSearch || currentSearch;
  const scrollRestoreKey = buildScrollRestoreKey(
    location.pathname,
    returnSearch,
  );
  const scrollAnchorId = buildProductScrollAnchorId({
    scope: scrollAnchorScope,
    productId:
      normalizedProduct.id || normalizedProduct.slug || normalizedProduct.name,
    index: scrollAnchorIndex,
  });
  const detailTarget = detailPath
    ? {
        pathname: detailPath,
        search: detailSearch,
        state: {
          returnTo: `${location.pathname}${returnSearch}`,
          scrollRestoreKey,
        },
      }
    : undefined;
  const categoryLabel =
    normalizedProduct.categoryName || normalizedProduct.sectionName || "";
  const stockQuantity = displayVariant
    ? Number(displayVariant.stockQuantity ?? 0)
    : Number(normalizedProduct.effectiveStockQuantity ?? normalizedProduct.stockQuantity ?? 0);
  const cardDescription =
    displayVariant?.description ||
    normalizedProduct.shortDescription ||
    "";
  const availabilityLabel = isAvailable
    ? normalizedProduct.trackInventory && stockQuantity > 0
      ? `متوفر ${stockQuantity}`
      : "متوفر الآن"
    : "نفد مؤقتاً";
  const discountBadgeLabel =
    normalizedProduct.hasDiscount && normalizedProduct.discountPercentage > 0
      ? `%${Math.round(normalizedProduct.discountPercentage)} خصم`
      : normalizedProduct.hasDiscount
        ? "عرض"
        : "";

  const handleNavigateToDetails = () => {
    if (typeof document === "undefined" || !detailTarget) {
      return;
    }

    const cardElement = document.getElementById(scrollAnchorId);
    const sectionElement = cardElement?.closest("[data-scroll-section]");

    captureElementScrollSnapshot(scrollRestoreKey, {
      element: cardElement,
      anchorId: scrollAnchorId,
      sectionId: sectionElement?.id || "",
    });
  };

  return (
    <SurfaceCard
      interactive
      className="product-card"
      id={scrollAnchorId}
      data-scroll-anchor={scrollAnchorId}
    >
      <Box
        component={detailTarget ? RouterLink : "div"}
        to={detailTarget}
        className="product-card__link"
        onClickCapture={handleNavigateToDetails}
      >
        <Box className="product-card__media">
          {image ? (
            <img
              src={image}
              alt={normalizedProduct.name}
              className="product-card__image"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Box className="product-card__media-empty">
              <Typography variant="body2" color="text.secondary">
                لا توجد صورة
              </Typography>
            </Box>
          )}

          <Box className="product-card__badges">
            {discountBadgeLabel ? (
              <span className="product-card__badge product-card__badge--sale">
                {discountBadgeLabel}
              </span>
            ) : null}
            {normalizedProduct.isWholesalePriceApplied ? (
              <span className="product-card__badge">سعر عميل</span>
            ) : null}
            {normalizedProduct.isFeatured ? (
              <span className="product-card__badge">مميز</span>
            ) : null}
            {!isAvailable ? (
              <span className="product-card__badge">نفد</span>
            ) : null}
          </Box>
        </Box>

        <Stack spacing={1} className="product-card__body">
          <Box className="product-card__copy">
            {categoryLabel ? (
              <Typography
                variant="overline"
                className="product-card__eyebrow"
              >
                {categoryLabel}
              </Typography>
            ) : null}

            <Typography variant="h6" className="product-card__title">
              {normalizedProduct.name}
            </Typography>

            <Box className="product-card__price-row">
              <Typography variant="subtitle1" className="product-card__price">
                {formatCurrency(price)}
              </Typography>
              {hasComparePrice ? (
                <Typography variant="body2" className="product-card__compare">
                  {formatCurrency(comparePrice)}
                </Typography>
              ) : null}
            </Box>

            {hasOriginalPrice ? (
              <Typography
                variant="caption"
                color="text.secondary"
                className="product-card__price-note"
              >
                قبل خصم العميل: {formatCurrency(originalPrice)}
              </Typography>
            ) : null}

            <Typography
              variant="body2"
              color="text.secondary"
              className="product-card__description"
            >
              {cardDescription ||
                "قطعة واضحة التفاصيل مع صورة تركز على المنتج نفسه."}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              className="product-card__availability"
            >
              {availabilityLabel}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} className="product-card__actions">
        {detailPath ? (
          <AppButton
            component={RouterLink}
            to={detailTarget}
            variant="text"
            endIcon={<OpenInNewRoundedIcon fontSize="small" />}
            className="product-card__detail-button"
            onClick={handleNavigateToDetails}
          >
            عرض
          </AppButton>
        ) : null}

        {onAddToCart ? (
          <AppButton
            variant="contained"
            size="small"
            loading={adding}
            loadingLabel="..."
            onClick={() => onAddToCart(normalizedProduct)}
            disabled={disableCartActions || !normalizedProduct.id || !isAvailable}
            startIcon={<LocalMallRoundedIcon fontSize="small" />}
            className={
              detailPath
                ? "product-card__add-button"
                : "product-card__add-button product-card__add-button--solo"
            }
          >
            أضف
          </AppButton>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}

export default memo(ProductCard, (previousProps, nextProps) => (
  previousProps.product === nextProps.product &&
  previousProps.storeSlug === nextProps.storeSlug &&
  previousProps.adding === nextProps.adding &&
  previousProps.disableCartActions === nextProps.disableCartActions &&
  previousProps.linkSearch === nextProps.linkSearch &&
  previousProps.scrollAnchorScope === nextProps.scrollAnchorScope &&
  previousProps.scrollAnchorIndex === nextProps.scrollAnchorIndex
));
