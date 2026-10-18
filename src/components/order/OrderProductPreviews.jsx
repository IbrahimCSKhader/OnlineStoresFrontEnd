import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import OrderProductImage from "./OrderProductImage.jsx";

const identity = value => value;

export default function OrderProductPreviews({ order, t = identity }) {
  const items = order.productPreviews?.length ? order.productPreviews : order.items || [];
  if (!items.length) return null;
  const visible = items.slice(0, 4);
  const hasMore = Math.max(Number(order.itemsCount) || 0, items.length) > visible.length;

  return (
    <Box component="section" aria-label={t("المنتجات المطلوبة")}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{t("المنتجات المطلوبة")}</Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1 }}>
        {visible.map((item, index) => (
          <Box component="li" key={item.id || `${item.productId}-${index}`}
            sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <OrderProductImage item={item} size={48} />
            <Box sx={{ minWidth: 0, flex: 1, overflowWrap: "anywhere" }}>
              <Typography variant="body2" fontWeight={600}>{item.productName || t("منتج")}</Typography>
              {item.variantName ? <Typography variant="caption" color="text.secondary">{item.variantName}</Typography> : null}
            </Box>
            {Number(item.quantity) > 0 ? (
              <Typography variant="body2" sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                {t("الكمية:")} {item.quantity}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>
      {hasMore ? <Typography component={RouterLink} to={`/owner/orders/${order.id}`}
        variant="body2" sx={{ display: "inline-block", mt: 1.5 }}>
        {t("عرض كل منتجات الطلب")}
      </Typography> : null}
    </Box>
  );
}
