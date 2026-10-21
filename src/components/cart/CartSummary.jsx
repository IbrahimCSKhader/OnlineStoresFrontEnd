import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";
import SurfaceCard from "../common/cards/SurfaceCard.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import "./CartSummary.css";

export default function CartSummary({
  subtotal = 0,
  totalAmount = 0,
  itemCount = 0,
  deliveryCost,
  checkoutPath,
  actionLabel = "متابعة إلى الدفع",
}) {
  const { t } = useStorefrontLanguage();
  return (
    <SurfaceCard className="cart-summary">
      <Box className="cart-summary__head">
        <Typography variant="h5">{t("ملخص الطلب")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {itemCount} {t("قطعة داخل السلة")}</Typography>
      </Box>

      <Divider />

      <Box className="cart-summary__rows">
        <Box className="cart-summary__row">
          <span>{t("الإجمالي الفرعي")}</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </Box>
        <Box className="cart-summary__row">
          <span>{t("الشحن")}</span>
          <span>{deliveryCost === undefined ? t("يُحدد في خطوة الدفع") : formatCurrency(deliveryCost)}</span>
        </Box>
        <Box className="cart-summary__row cart-summary__row--total">
          <span>{t("الإجمالي")}</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </Box>
      </Box>

      <AppButton component={RouterLink} to={checkoutPath} variant="contained" fullWidth>
        {t(actionLabel)}
      </AppButton>
    </SurfaceCard>
  );
}
