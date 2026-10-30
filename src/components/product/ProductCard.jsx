import { offerSavingsPercent } from "../../utils/offers.js";
import useOffers from "../../hooks/offers/useOffers.js";
import OfferBadge from "../offers/OfferBadge.jsx";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { memo, useRef, useState } from "react";
import IconButton from "@mui/material/IconButton";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
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
  const { t } = useStorefrontLanguage();
  const location = useLocation();
  const [quantity, setQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState(false);
  const inFlight = useRef(false);
  const normalizedProduct = normalizeProductDto(product);
  const offers = useOffers(normalizedProduct.storeId);
  const bundle = (offers.data || []).find(o => Number(o.type) === 1 && o.items.some(i => i.productId === normalizedProduct.id));
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
  const maxQuantity = normalizedProduct.trackInventory
    ? Math.max(0, Math.floor(stockQuantity)) : Number.MAX_SAFE_INTEGER;
  const selectedQuantity = Math.min(quantity, maxQuantity);
  const cartDisabled = disableCartActions || !normalizedProduct.id || !isAvailable;
  const busy = submitting || adding;
  const handleAdd = async () => {
    if (cartDisabled || busy || inFlight.current || selectedQuantity < 1) return;
    inFlight.current = true;
    setSubmitting(true);
    setAddError(false);
    try {
      const result = await onAddToCart(normalizedProduct, selectedQuantity);
      if (result !== false) setQuantity(0);
    } catch {
      setAddError(true);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };
  const cardDescription =
    displayVariant?.description ||
    normalizedProduct.shortDescription ||
    "";
  const availabilityLabel = isAvailable
    ? normalizedProduct.trackInventory && stockQuantity > 0
      ? t("متوفر {0}", stockQuantity)
      : t("متوفر الآن")
    : t("نفد مؤقتاً");
  const discountBadgeLabel =
    normalizedProduct.hasDiscount && normalizedProduct.discountPercentage > 0
      ? t("%{0} خصم", Math.round(normalizedProduct.discountPercentage))
      : normalizedProduct.hasDiscount
        ? t("عرض")
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
          {bundle && <OfferBadge>{t("وفر")} {offerSavingsPercent(bundle)}%</OfferBadge>}
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
              <Typography variant="body2" color="text.secondary">{t("لا توجد صورة")}</Typography>
            </Box>
          )}

          <Box className="product-card__badges">
            {discountBadgeLabel ? (
              <span className="product-card__badge product-card__badge--sale">
                {discountBadgeLabel}
              </span>
            ) : null}
            {normalizedProduct.isWholesalePriceApplied ? (
              <span className="product-card__badge">{t("سعر عميل")}</span>
            ) : null}
            {normalizedProduct.isFeatured ? (
              <span className="product-card__badge">{t("مميز")}</span>
            ) : null}
            {!isAvailable ? (
              <span className="product-card__badge">{t("نفد")}</span>
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
              >{t("قبل خصم العميل:")} {formatCurrency(originalPrice)}
              </Typography>
            ) : null}

            <Typography
              variant="body2"
              color="text.secondary"
              className="product-card__description"
            >
              {cardDescription ||
                t("قطعة واضحة التفاصيل مع صورة تركز على المنتج نفسه.")}
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

      {onAddToCart ? (
        <Box className="product-card__quantity" role="group" aria-label={t("الكمية")}>
          <IconButton size="small" aria-label={t("تقليل الكمية")} disabled={cartDisabled || busy || selectedQuantity === 0}
            onClick={() => setQuantity(Math.max(0, selectedQuantity - 1))}><RemoveRoundedIcon fontSize="small" /></IconButton>
          <Box component="output" aria-live="polite" aria-label={t("الكمية")}>{selectedQuantity}</Box>
          <IconButton size="small" aria-label={t("زيادة الكمية")} disabled={cartDisabled || busy || selectedQuantity >= maxQuantity}
            onClick={() => setQuantity(Math.min(maxQuantity, selectedQuantity + 1))}><AddRoundedIcon fontSize="small" /></IconButton>
        </Box>
      ) : null}
      {addError ? <Typography role="alert" variant="caption" className="product-card__cart-error">{t("تعذر إضافة المنتج للسلة. حاول مرة أخرى.")}</Typography> : null}
      <Stack direction="row" spacing={1} className="product-card__actions">
        {detailPath ? (
          <AppButton
            component={RouterLink}
            to={detailTarget}
            variant="text"
            endIcon={<OpenInNewRoundedIcon fontSize="small" />}
            className="product-card__detail-button"
            onClick={handleNavigateToDetails}
          >{t("عرض المنتج")}</AppButton>
        ) : null}

        {onAddToCart ? (
          <AppButton
            variant="contained"
            size="small"
            loading={busy}
            loadingLabel="..."
            onClick={handleAdd}
            disabled={cartDisabled || selectedQuantity < 1}
            startIcon={<LocalMallRoundedIcon fontSize="small" />}
            className={
              detailPath
                ? "product-card__add-button"
                : "product-card__add-button product-card__add-button--solo"
            }
          >{t("أضف")}</AppButton>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}

export default memo(ProductCard, (previousProps, nextProps) => (
  previousProps.product === nextProps.product &&
  previousProps.onAddToCart === nextProps.onAddToCart &&
  previousProps.storeSlug === nextProps.storeSlug &&
  previousProps.adding === nextProps.adding &&
  previousProps.disableCartActions === nextProps.disableCartActions &&
  previousProps.linkSearch === nextProps.linkSearch &&
  previousProps.scrollAnchorScope === nextProps.scrollAnchorScope &&
  previousProps.scrollAnchorIndex === nextProps.scrollAnchorIndex
));

