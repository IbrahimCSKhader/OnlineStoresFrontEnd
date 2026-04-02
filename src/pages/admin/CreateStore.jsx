import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import "./StoresManagement.css";

const defaultValues = {
  name: "",
  slug: "",
  description: "",
  businessType: "",
  logoUrl: "",
  coverImageUrl: "",
  isActive: true,
};

function cleanPayload(values) {
  const payload = {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim(),
    businessType: values.businessType.trim(),
    logoUrl: values.logoUrl.trim(),
    coverImageUrl: values.coverImageUrl.trim(),
    isActive: values.isActive,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => typeof value === "boolean" || value !== ""),
  );
}

export default function CreateStore({
  title = "إضافة متجر جديد",
  description = "أضف متجرًا جديدًا من هنا، وبعدها سيظهر مباشرة في السوق وصفحة الإدارة.",
  submitLabel = "إضافة المتجر",
  loading = false,
  onSubmit,
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues });

  const handleFormSubmit = async (values) => {
    await onSubmit?.(cleanPayload(values));
    reset(defaultValues);
  };

  return (
    <Box component="section" className="admin-store-form">
      <Stack spacing={0.75} className="admin-store-form__intro">
        <Typography variant="overline" className="admin-store-form__eyebrow">
          إدارة المتاجر
        </Typography>
        <Typography variant="h5" component="h2" className="admin-store-form__title">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>

      <Box component="form" className="admin-store-form__body" onSubmit={handleSubmit(handleFormSubmit)}>
        <Box className="admin-store-form__grid">
          <TextField
            label="اسم المتجر"
            placeholder="مثال: متجر الموجة"
            fullWidth
            {...register("name", { required: "اسم المتجر مطلوب" })}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
          />
          <TextField
            label="رابط المتجر"
            placeholder="مثال: mawja-store"
            fullWidth
            {...register("slug")}
            helperText="يمكن تركه فارغًا وسننظمه لك تلقائيًا."
          />
          <TextField
            label="نوع النشاط"
            placeholder="مثال: متجر ملابس"
            fullWidth
            {...register("businessType")}
          />
          <TextField
            label="رابط الشعار"
            placeholder="https://..."
            fullWidth
            {...register("logoUrl")}
          />
          <TextField
            label="رابط الغلاف"
            placeholder="https://..."
            fullWidth
            {...register("coverImageUrl")}
          />
        </Box>

        <TextField
          label="وصف المتجر"
          placeholder="وصف قصير يوضح ما يقدمه المتجر"
          fullWidth
          multiline
          minRows={4}
          {...register("description")}
        />

        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              className="admin-store-form__switch"
              control={
                <Switch
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              }
              label="المتجر نشط"
            />
          )}
        />

        <Box className="admin-store-form__actions">
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "جاري الحفظ..." : submitLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
