import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import "./CartItem.css";

function firstImageUrl(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (Array.isArray(value)) {
      const imageUrl = value
        .map((image) => image?.url || image?.Url || image?.imageUrl || image?.ImageUrl)
        .find(Boolean);

      if (imageUrl) {
        return imageUrl;
      }
    }
  }

  return "";
}

function resolveCartItemImage(item) {
  const raw = item?.raw || {};
  const variant = item?.variant || item?.Variant || raw.variant || raw.Variant || {};
  const product = item?.product || item?.Product || raw.product || raw.Product || {};

  return firstImageUrl(
    item?.effectiveVariantImageUrl,
    item?.EffectiveVariantImageUrl,
    raw.effectiveVariantImageUrl,
    raw.EffectiveVariantImageUrl,
    item?.variantImageUrl,
    item?.VariantImageUrl,
    raw.variantImageUrl,
    raw.VariantImageUrl,
    variant.effectiveImageUrl,
    variant.EffectiveImageUrl,
    variant.imageUrl,
    variant.ImageUrl,
    variant.images,
    variant.Images,
    item?.imageUrl,
    item?.ImageUrl,
    raw.imageUrl,
    raw.ImageUrl,
    item?.productThumbnail,
    item?.ProductThumbnail,
    raw.productThumbnail,
    raw.ProductThumbnail,
    product.thumbnailUrl,
    product.ThumbnailUrl,
    product.imageUrl,
    product.ImageUrl,
    product.images,
    product.Images,
  );
}

export default function CartItem({ item, storeSlug }) {
  const imageUrl = resolveAssetUrl(resolveCartItemImage(item));
  const detailPath =
    storeSlug && item.productId
      ? buildStorefrontPath(storeSlug, `/product/${item.productId}`)
      : "";
  const variantMeta = [
    item.variantAttributes,
    item.variantSku ? `SKU: ${item.variantSku}` : "",
  ].filter(Boolean);

  return (
    <Box className="cart-item">
      <Box
        component={detailPath ? RouterLink : "div"}
        to={detailPath || undefined}
        className="cart-item__media"
      >
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="cart-item__image" />
        ) : (
          <Box className="cart-item__image cart-item__image--empty" />
        )}
      </Box>

      <Box className="cart-item__content">
        <Typography variant="subtitle1" className="cart-item__title">
          {item.name}
        </Typography>
        {item.variantName ? (
          <Typography variant="body2" color="text.secondary">
            {item.variantName}
          </Typography>
        ) : null}
        {variantMeta.length ? (
          <Typography variant="body2" color="text.secondary">
            {variantMeta.join("، ")}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
