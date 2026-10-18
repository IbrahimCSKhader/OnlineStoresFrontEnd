import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";

export default function CouponForm({
  form,
  isEdit,
  loading,
  onChange,
  onReset,
  onSubmit,
}) {
  const { t } = useOwnerLanguage();
  return (
    <Box className="owner-form-card">
      <Box component="form" className="owner-form" onSubmit={onSubmit}>
        <TextField
          label={t("كود الكوبون")}
          value={form.code}
          size="small"
          required
          onChange={(event) => onChange("code", event.target.value.toUpperCase())}
        />

        <TextField
          select
          size="small"
          label={t("نوع الخصم")}
          value={form.discountType}
          onChange={(event) => onChange("discountType", event.target.value)}
        >
          <MenuItem value="0">{t("نسبة مئوية")}</MenuItem>
          <MenuItem value="1">{t("قيمة ثابتة")}</MenuItem>
        </TextField>

        <TextField
          label={t("قيمة الخصم")}
          value={form.discountValue}
          size="small"
          required
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          onChange={(event) => onChange("discountValue", event.target.value)}
        />

        <Box className="owner-form__switch">
          <Typography variant="body2">{t("نشط")}</Typography>
          <Switch
            checked={form.isActive}
            onChange={(event) => onChange("isActive", event.target.checked)}
          />
        </Box>

        <Stack direction="row" spacing={1} className="owner-form__actions">
          <AppButton type="submit" variant="contained" loading={loading}>
            {t(isEdit ? "حفظ الكوبون" : "إضافة كوبون")}
          </AppButton>
          {isEdit ? (
            <AppButton type="button" variant="outlined" onClick={onReset}>{t("إلغاء التعديل")}</AppButton>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
