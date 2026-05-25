import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import {
  getVariantAttributeLabel,
  getVariantEffectiveComparePrice,
  getVariantEffectiveImage,
  getVariantEffectivePrice,
} from "../../utils/products.js";

export default function ProductVariantPicker({
  variants,
  selectedVariantId,
  product,
  onChange,
}) {
  if (!variants?.length) {
    return null;
  }

  const activeVariants = variants.filter(
    (variant) => variant.isActive === true || variant.isActive === undefined,
  );

  if (!activeVariants.length) {
    return null;
  }

  return (
    <Box className="product-variants">
      <Typography variant="subtitle1" className="product-details__block-title">
        الأصناف المتاحة
      </Typography>

      <Box className="product-variants__grid">
        {activeVariants.map((variant) => {
          const isActive = String(variant.id) === String(selectedVariantId);
          const isAvailable =
            !product?.trackInventory || Number(variant.stockQuantity ?? 0) > 0;
          const price = getVariantEffectivePrice(variant, product);
          const compareAtPrice = getVariantEffectiveComparePrice(variant, product);
          const hasCompareAtPrice = compareAtPrice > price;
          const attributesLabel = getVariantAttributeLabel(variant);
          const imageUrl = resolveAssetUrl(getVariantEffectiveImage(variant, product));
          const handleClick = () => {
            if (!isAvailable) {
              return;
            }

            onChange(variant.id);
          };

          return (
            <button
              key={variant.id ?? variant.name}
              type="button"
              className={`product-variants__item${isActive ? " product-variants__item--active" : ""}${!isAvailable ? " product-variants__item--disabled" : ""}`}
              onClick={handleClick}
              disabled={!isAvailable}
              aria-pressed={isActive}
              aria-disabled={!isAvailable}
            >
              <Stack
                direction="row"
                spacing={1.25}
                className="product-variants__item-content"
              >
                <Box className="product-variants__thumb">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={variant.name || product?.name || "صنف"}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      صورة
                    </Typography>
                  )}
                </Box>

                <Stack spacing={0.65} className="product-variants__meta">
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography variant="subtitle2">{variant.name}</Typography>
                    <Chip
                      size="small"
                      label={
                        isAvailable
                          ? `${variant.stockQuantity ?? 0} متوفر`
                          : "غير متوفر"
                      }
                      variant="outlined"
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(price)}
                    </Typography>
                    {hasCompareAtPrice ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textDecoration: "line-through" }}
                      >
                        {formatCurrency(compareAtPrice)}
                      </Typography>
                    ) : null}
                  </Stack>

                  {attributesLabel ? (
                    <Typography variant="body2" color="text.secondary">
                      {attributesLabel}
                    </Typography>
                  ) : null}

                  {variant.sku ? (
                    <Typography variant="body2" color="text.secondary">
                      SKU: {variant.sku}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </button>
          );
        })}
      </Box>
    </Box>
  );
}
