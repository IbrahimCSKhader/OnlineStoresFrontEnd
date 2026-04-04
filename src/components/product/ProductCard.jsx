import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  getProductImage,
} from "../../utils/storefront.js";
import "./ProductCard.css";

function ProductCard({
  product,
  storeSlug,
  onAddToCart,
  adding,
}) {
  const image = resolveAssetUrl(getProductImage(product));
  const price = getProductDisplayPrice(product);
  const comparePrice = getProductComparePrice(product);
  const hasComparePrice = comparePrice > price;
  const resolvedStoreSlug = storeSlug || product.storeSlug;
  const detailPath =
    resolvedStoreSlug && product.id
      ? `/market/${resolvedStoreSlug}/product/${product.id}`
      : "";
  const categoryLabel = product.categoryName || product.sectionName || "";
  const stockQuantity = Number(product.stockQuantity ?? 0);
  const availabilityLabel =
    stockQuantity > 0 ? `متوفر ${stockQuantity}` : "نفد مؤقتاً";

  return (
    <SurfaceCard interactive className="product-card">
      <Box
        component={detailPath ? RouterLink : "div"}
        to={detailPath || undefined}
        className="product-card__link"
      >
        <Box className="product-card__media">
          {image ? (
            <img
              src={image}
              alt={product.name}
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
            {hasComparePrice ? (
              <span className="product-card__badge product-card__badge--sale">
                عرض
              </span>
            ) : null}
            {product.isFeatured ? (
              <span className="product-card__badge">مميز</span>
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
              {product.name}
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

            <Typography
              variant="body2"
              color="text.secondary"
              className="product-card__description"
            >
              {product.shortDescription ||
                product.description ||
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
            to={detailPath}
            variant="text"
            endIcon={<OpenInNewRoundedIcon fontSize="small" />}
            className="product-card__detail-button"
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
            onClick={() => onAddToCart(product)}
            disabled={!product.id || stockQuantity <= 0}
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
  previousProps.adding === nextProps.adding
));
