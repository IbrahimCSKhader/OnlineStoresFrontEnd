import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";

export default function CustomerStoreForm({ form, loading, onChange, onReset, onSubmit }) {
  const customerName = form.fullName || "عميل المتجر";

  return (
    <Box className="owner-form-card">
      <Alert severity="info" className="owner-inline-alert">
        هذه الواجهة مخصصة فقط لإدارة العملاء المسجلين في المتجر، مثل الخصم والحالة، وليست
        لإنشاء عميل جديد.
      </Alert>

      <Box component="form" className="owner-form" onSubmit={onSubmit}>
        <TextField size="small" label="اسم العميل" value={customerName} disabled />
        <TextField size="small" label="البريد الإلكتروني" value={form.email || "-"} disabled />
        <TextField size="small" label="رقم الهاتف" value={form.phone || "-"} disabled />

        <TextField
          label="نسبة الخصم"
          value={form.discountPercentage}
          size="small"
          required
          type="number"
          inputProps={{ min: 0, max: 100, step: "0.01" }}
          onChange={(event) => onChange("discountPercentage", event.target.value)}
          helperText="من 0 إلى 100%"
        />

        <Box className="owner-form__switch">
          <Typography variant="body2">الحساب مفعل</Typography>
          <Switch
            checked={form.isActive}
            onChange={(event) => onChange("isActive", event.target.checked)}
          />
        </Box>

        <Box className="owner-customer-preview">
          <Typography variant="body2" fontWeight={700}>
            {customerName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {form.email || "سيظهر البريد الإلكتروني هنا."}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} className="owner-form__actions">
          <AppButton type="submit" variant="contained" loading={loading}>
            حفظ إعدادات العميل
          </AppButton>
          <AppButton type="button" variant="outlined" onClick={onReset}>
            إلغاء
          </AppButton>
        </Stack>
      </Box>
    </Box>
  );
}
