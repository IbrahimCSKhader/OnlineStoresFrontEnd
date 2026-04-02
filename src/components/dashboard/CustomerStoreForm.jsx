import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";

function getCustomerOptionLabel(customer) {
  if (!customer) return "";

  const primary = customer.name || customer.email || customer.id || "";
  const secondary = customer.name && customer.email ? customer.email : customer.id || "";

  return secondary ? `${primary} - ${secondary}` : primary;
}

export default function CustomerStoreForm({
  form,
  isEdit,
  loading,
  customers,
  selectedCustomer,
  onChange,
  onReset,
  onSubmit,
}) {
  const selectedOption =
    customers.find((customer) => customer.id === form.customerId) || selectedCustomer || null;

  return (
    <Box className="owner-form-card">
      <Box component="form" className="owner-form" onSubmit={onSubmit}>
        <Autocomplete
          options={customers}
          value={selectedOption}
          disabled={isEdit}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={getCustomerOptionLabel}
          onChange={(_, value) => onChange("customerId", value?.id || "")}
          renderInput={(params) => (
            <TextField
              {...params}
              required
              size="small"
              label="المستخدم المسجل"
              helperText={
                isEdit
                  ? "يمكن تعديل الخصم والحالة فقط بعد إضافة العميل."
                  : "اختر مستخدمًا مسجلًا ليظهر له سعر الجملة داخل متجرك."
              }
            />
          )}
        />

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
          <Typography variant="body2">الخصم مفعل</Typography>
          <Switch
            checked={form.isActive}
            onChange={(event) => onChange("isActive", event.target.checked)}
          />
        </Box>

        <Box className="owner-customer-preview">
          <Typography variant="body2" fontWeight={700}>
            {selectedCustomer?.name || "لم يتم اختيار مستخدم بعد"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedCustomer?.email || "سيظهر البريد الإلكتروني هنا بعد اختيار المستخدم."}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} className="owner-form__actions">
          <AppButton type="submit" variant="contained" loading={loading}>
            {isEdit ? "حفظ خصم العميل" : "إضافة عميل للمتجر"}
          </AppButton>
          {isEdit ? (
            <AppButton type="button" variant="outlined" onClick={onReset}>
              إلغاء التعديل
            </AppButton>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
