import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import "./CartItem.css";

export default function CartItem({ item, storeSlug }) {
  const imageUrl = resolveAssetUrl(
    item.effectiveVariantImageUrl || item.variantImageUrl || item.imageUrl,
  );
  const detailPath =
    storeSlug && item.productId ? `/market/${storeSlug}/product/${item.productId}` : "";
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
