import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatCurrency } from "../../utils/formatCurrency.js";

export default function ProductVariantPicker({
  variants,
  selectedVariantId,
  onChange,
}) {
  if (!variants?.length) {
    return null;
  }

  return (
    <Box className="product-variants">
      <Typography variant="subtitle1" className="product-details__block-title">
        الخيارات المتاحة
      </Typography>

      <Box className="product-variants__grid">
        {variants.map((variant) => {
          const isActive = variant.id === selectedVariantId;

          return (
            <button
              key={variant.id ?? variant.name}
              type="button"
              className={`product-variants__item${isActive ? " product-variants__item--active" : ""}`}
              onClick={() => onChange(variant.id)}
            >
              <Stack spacing={0.65}>
                <Stack direction="row" justifyContent="space-between" gap={1}>
                  <Typography variant="subtitle2">{variant.name}</Typography>
                  <Chip
                    size="small"
                    label={`${variant.stockQuantity ?? 0} متوفر`}
                    variant="outlined"
                  />
                </Stack>

                {variant.priceOverride ? (
                  <Typography variant="body2" color="text.secondary">
                    سعر هذا الخيار: {formatCurrency(variant.priceOverride)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    يستخدم السعر الأساسي للمنتج
                  </Typography>
                )}
              </Stack>
            </button>
          );
        })}
      </Box>
    </Box>
  );
}
