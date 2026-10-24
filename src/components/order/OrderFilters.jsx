import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import AppButton from "../common/buttons/AppButton.jsx";
import { emptyOrderFilters } from "../../utils/orderFilters.js";

export default function OrderFilters({ value, onChange, onReset, t }) {
  const change = key => event => onChange({ ...value, [key]: event.target.value });
  return <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "2fr 1fr 1fr 1.5fr auto" }, gap: 2, alignItems: "center" }}>
      <TextField size="small" label={t("البحث حسب العميل")} placeholder={t("اسم العميل أو الإيميل أو الهاتف")} value={value.customer} onChange={change("customer")} />
      <TextField size="small" type="date" label={t("من تاريخ")} value={value.from} onChange={change("from")} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField size="small" type="date" label={t("إلى تاريخ")} value={value.to} onChange={change("to")} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField select size="small" label={t("ترتيب الطلبات")} value={value.sort} onChange={change("sort")}>
        <MenuItem value="customer">{t("حسب العميل")}</MenuItem>
        <MenuItem value="newest">{t("الأحدث أولاً")}</MenuItem>
        <MenuItem value="oldest">{t("الأقدم أولاً")}</MenuItem>
      </TextField>
      <AppButton variant="outlined" onClick={() => onReset ? onReset() : onChange({ ...emptyOrderFilters })}>{t("مسح فلاتر الطلبات")}</AppButton>
    </Box>
    {value.from && value.to && value.from > value.to ? <Alert severity="error" sx={{ mt: 2 }}>{t("تاريخ البداية يجب أن يسبق تاريخ النهاية")}</Alert> : null}
  </Box>;
}
