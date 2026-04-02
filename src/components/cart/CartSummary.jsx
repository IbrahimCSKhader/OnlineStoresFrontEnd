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
  checkoutPath,
  actionLabel = "متابعة إلى الدفع",
}) {
  return (
    <SurfaceCard className="cart-summary">
      <Box className="cart-summary__head">
        <Typography variant="h5">ملخص الطلب</Typography>
        <Typography variant="body2" color="text.secondary">
          {itemCount} قطعة داخل السلة
        </Typography>
      </Box>

      <Divider />

      <Box className="cart-summary__rows">
        <Box className="cart-summary__row">
          <span>الإجمالي الفرعي</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </Box>
        <Box className="cart-summary__row">
          <span>الشحن</span>
          <span>يُحدد في خطوة الدفع</span>
        </Box>
        <Box className="cart-summary__row cart-summary__row--total">
          <span>الإجمالي</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </Box>
      </Box>

      <AppButton component={RouterLink} to={checkoutPath} variant="contained" fullWidth>
        {actionLabel}
      </AppButton>
    </SurfaceCard>
  );
}
