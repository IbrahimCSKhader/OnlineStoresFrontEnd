import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";

export default function CategoryForm({
  form,
  isEdit,
  categories,
  loading,
  slugPreview,
  onChange,
  onReset,
  onSubmit,
}) {
  return (
    <Box className="owner-form-card">
      <Alert severity="info" className="owner-inline-alert">
        يتم تعبئة رابط التصنيف تلقائيًا من الاسم، ويمكنك تعديله قبل أول حفظ فقط.
      </Alert>

      <Box component="form" className="owner-form" onSubmit={onSubmit}>
        <TextField
          label="اسم التصنيف"
          value={form.name}
          size="small"
          required
          onChange={(event) => onChange("name", event.target.value)}
        />

        <TextField
          label="رابط التصنيف"
          value={form.slug}
          size="small"
          required
          disabled={isEdit}
          helperText={`الرابط الحالي: /${slugPreview || "category"}`}
          onChange={(event) => onChange("slug", event.target.value)}
        />

        <TextField
          select
          size="small"
          label="التصنيف الأعلى"
          value={form.parentCategoryId}
          onChange={(event) => onChange("parentCategoryId", event.target.value)}
        >
          <MenuItem value="">بدون تصنيف أعلى</MenuItem>
          {categories
            .filter((item) => item.id !== form.id)
            .map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.label}
              </MenuItem>
            ))}
        </TextField>

        <TextField
          label="الترتيب"
          value={form.displayOrder}
          size="small"
          type="number"
          inputProps={{ min: 0, step: 1 }}
          onChange={(event) => onChange("displayOrder", event.target.value)}
        />

        <TextField
          label="الوصف"
          value={form.description}
          size="small"
          multiline
          minRows={3}
          className="owner-form__wide"
          onChange={(event) => onChange("description", event.target.value)}
        />

        <Box className="owner-form__switch">
          <Typography variant="body2">إظهاره للزوار</Typography>
          <Switch
            checked={form.isActive}
            onChange={(event) => onChange("isActive", event.target.checked)}
          />
        </Box>

        <Stack direction="row" spacing={1} className="owner-form__actions">
          <AppButton type="submit" variant="contained" loading={loading}>
            {isEdit ? "حفظ التصنيف" : "إضافة التصنيف"}
          </AppButton>
          {isEdit ? (
            <AppButton type="button" variant="outlined" onClick={onReset}>
              إلغاء
            </AppButton>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
