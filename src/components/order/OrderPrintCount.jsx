import Chip from "@mui/material/Chip";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import { useOrderPrintCounts } from "../../hooks/orders/useOrderPrints.js";

export default function OrderPrintCount({ storeId, orderId }) {
  const { t, dateTime } = useOwnerLanguage();
  const query = useOrderPrintCounts(storeId);
  const entry = query.data?.find(x => x.orderId === orderId);
  const count = query.isSuccess ? entry?.printCount || 0 : "—";
  const title = query.isError ? t("تعذر تحميل عداد الطباعة") : entry?.lastPrintedAt ? `${t("آخر محاولة طباعة")}: ${dateTime(entry.lastPrintedAt)}` : t("يتم احتساب فتح نافذة الطباعة، حتى عند إلغائها.");
  return <Chip size="small" variant="outlined" icon={<PrintRoundedIcon />} label={`${t("محاولات الطباعة")}: ${count}`} title={title} />;
}
