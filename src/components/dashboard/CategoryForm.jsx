import { useEffect, useState } from "react";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
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
  onChange,
  onReset,
  onSubmit,
}) {
  const [preview, setPreview] = useState("");
  const [imageError, setImageError] = useState("");
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview, form.imageFile]);
  const imageSrc = form.imageFile ? preview : resolveAssetUrl(form.imageUrl);
  const selectImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(jpe?g|png|webp)$/i.test(file.name) || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("اختر صورة بصيغة JPG أو PNG أو WebP.");
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setImageError("حجم الصورة يجب أن يكون أكبر من صفر ولا يتجاوز 5 ميجابايت.");
      return;
    }
    setImageError("");
    setPreview(URL.createObjectURL(file));
    onChange("imageFile", file);
  };
  return (
    <Box className="owner-form-card">
      <Alert severity="info" className="owner-inline-alert">
        أنشئ تصنيفات واضحة ليسهل على الزوار الوصول للمنتجات بسرعة.
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

        <Stack spacing={1} className="owner-form__wide">
          <Typography variant="body2">{"صورة التصنيف"}</Typography>
          <AppButton component="label" variant="outlined" disabled={loading}>
            {(imageSrc ? "تغيير الصورة" : "رفع صورة من الجهاز")}
            <input hidden type="file" aria-label={"صورة التصنيف"}
              accept="image/jpeg,image/png,image/webp" onChange={selectImage} disabled={loading} />
          </AppButton>
          <Typography variant="caption" color="text.secondary">{"JPG أو PNG أو WebP، حتى 5 ميجابايت"}</Typography>
          {imageError ? <Alert severity="error">{imageError}</Alert> : null}
          {imageSrc ? <Box component="img" src={imageSrc} alt={"معاينة صورة التصنيف"}
            sx={{ width: 160, height: 120, objectFit: "cover", borderRadius: 2 }} /> : null}
          {form.imageFile ? <Typography variant="caption">{form.imageFile.name}</Typography> : null}
        </Stack>

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
