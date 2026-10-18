import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import AppButton from "../common/buttons/AppButton.jsx";
import { resolveAssetUrl } from "../../utils/assetUrl.js";

const PRODUCT_STATUS_OPTIONS = [
  { value: "1", label: "ظاهر" },
  { value: "0", label: "مسودة" },
  { value: "2", label: "مؤرشف" },
  { value: "3", label: "نفد" },
];

function getVariantFormKey(variant, index) {
  return String(variant?.id || variant?.localId || index);
}

function getVariantImages(variant) {
  return Array.isArray(variant?.images) ? variant.images : [];
}

function getVariantDisplayImage(variant, preview) {
  const previewItem = Array.isArray(preview) ? preview[0] : preview;

  if (previewItem?.url) {
    return previewItem.url;
  }

  const images = getVariantImages(variant);
  return resolveAssetUrl(
    variant?.effectiveImageUrl ||
      variant?.imageUrl ||
      images[0]?.url ||
      "",
  );
}

export default function ProductForm({
  form,
  isEdit,
  loading,
  categories,
  sections,
  categoryHint,
  newImagePreviews,
  defaultCategoryId,
  defaultSectionId,
  onChange,
  onAppendImages,
  onRemoveNewImage,
  onDeleteExistingImage,
  deletingImageId,
  onAddVariant,
  onChangeVariant,
  onRemoveVariant,
  onSaveVariant,
  variantActionLoading,
  variantImagePreviews = {},
  variantImageUploadingId,
  onChangeVariantImageFile,
  onRemoveVariantImageFile,
  onReset,
  onSubmit,
}) {
  const { t } = useOwnerLanguage();
  const hasRequirements = categories.length && sections.length;
  const variants = Array.isArray(form.variants) ? form.variants : [];

  return (
    <Box className="owner-form-card">
      {!hasRequirements ? (
        <Alert severity="warning" className="owner-inline-alert">{t("أضف تصنيفًا وقسمًا واحدًا على الأقل قبل إضافة منتج جديد.")}</Alert>
      ) : null}

      <Alert severity="info" className="owner-inline-alert">
        {t(isEdit
          ? "عدّل تفاصيل المنتج وصوره ثم احفظ التغييرات مباشرة."
          : "أضف اسم المنتج وسعره وصوره ليظهر للزوار بشكل مرتب.")}
      </Alert>

      <Box component="form" className="owner-form" onSubmit={onSubmit}>
        <TextField
          label={t("اسم المنتج")}
          value={form.name}
          size="small"
          required
          onChange={(event) => onChange("name", event.target.value)}
        />

        <TextField
          label={t("السعر")}
          value={form.price}
          size="small"
          required
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          onChange={(event) => onChange("price", event.target.value)}
        />

        <TextField
          label={t("سعر الجملة")}
          value={form.wholesalePrice}
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          onChange={(event) => onChange("wholesalePrice", event.target.value)}
        />

        <TextField
          label={t("السعر قبل التخفيض")}
          value={form.compareAtPrice}
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          onChange={(event) => onChange("compareAtPrice", event.target.value)}
        />

        <TextField
          label={t("الكمية")}
          value={form.stockQuantity}
          size="small"
          required
          type="number"
          inputProps={{ min: 0, step: "1" }}
          onChange={(event) => onChange("stockQuantity", event.target.value)}
        />

        <TextField
          select
          size="small"
          label={t("التصنيف")}
          required
          value={form.categoryId || defaultCategoryId || ""}
          onChange={(event) => onChange("categoryId", event.target.value)}
        >
          {categories.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {t(item.label)}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label={t("القسم")}
          required
          value={form.sectionId || defaultSectionId || ""}
          onChange={(event) => onChange("sectionId", event.target.value)}
        >
          {sections.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {t(item.name)}
              {t(!item.isActive ? " (مخفي)" : "")}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label={t("ملخص عام للمنتج (اختياري)")}
          value={form.shortDescription}
          size="small"
          onChange={(event) => onChange("shortDescription", event.target.value)}
        />

        <TextField
          label={t("الوصف")}
          value={form.description}
          size="small"
          multiline
          minRows={3}
          className="owner-form__wide"
          onChange={(event) => onChange("description", event.target.value)}
        />

        <Box className="owner-form__switch">
          <Typography variant="body2">{t("متابعة الكمية")}</Typography>
          <Switch
            checked={form.trackInventory}
            onChange={(event) => onChange("trackInventory", event.target.checked)}
          />
        </Box>

        <Box className="owner-form__switch">
          <Typography variant="body2">{t("تمييز المنتج")}</Typography>
          <Switch
            checked={form.isFeatured}
            onChange={(event) => onChange("isFeatured", event.target.checked)}
          />
        </Box>

        {isEdit ? (
          <TextField
            select
            size="small"
            label={t("الحالة")}
            value={form.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            {PRODUCT_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {t(option.label)}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Box className="owner-form__switch">
            <Typography variant="body2">{t("نشر مباشر")}</Typography>
            <Switch
              checked={form.publishNow}
              onChange={(event) => onChange("publishNow", event.target.checked)}
            />
          </Box>
        )}

        <Box className="owner-form__wide owner-variants">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
          >
            <Box>
              <Typography variant="subtitle2" className="owner-gallery__title">{t("نسخ المنتج")}</Typography>
              <Typography variant="caption" color="text.secondary">{t("أضف النسخ الأساسية مثل اللون والمقاس. TODO: ربط AttributeValueIds من واجهة خصائص مخصصة.")}</Typography>
            </Box>
            <AppButton
              type="button"
              variant="outlined"
              startIcon={<AddRoundedIcon fontSize="small" />}
              onClick={onAddVariant}
            >{t("إضافة نسخة")}</AppButton>
          </Stack>

          {variants.length ? (
            <Box className="owner-variants__list">
              {variants.map((variant, index) => {
                const isExistingVariant = Boolean(variant.id);
                const variantKey = getVariantFormKey(variant, index);
                const variantPreview = variantImagePreviews[variantKey];
                const variantPreviewItems = Array.isArray(variantPreview)
                  ? variantPreview
                  : variantPreview
                    ? [variantPreview]
                    : [];
                const variantImages = getVariantImages(variant);
                const variantImage = getVariantDisplayImage(
                  variant,
                  variantPreview,
                );
                const isVariantImageUploading =
                  variantImageUploadingId &&
                  String(variantImageUploadingId) === String(variant.id);

                return (
                  <Box key={variant.id || variant.localId || index} className="owner-variants__item">
                    <TextField
                      label={t("اسم النسخة")}
                      value={variant.name || ""}
                      size="small"
                      onChange={(event) => onChangeVariant(index, "name", event.target.value)}
                    />
                    <TextField
                      label={t("الوصف القصير للصنف")}
                      value={variant.description || ""}
                      size="small"
                      multiline
                      minRows={2}
                      className="owner-variant-description"
                      onChange={(event) =>
                        onChangeVariant(index, "description", event.target.value)
                      }
                    />
                    <TextField
                      label={t("السعر الاختياري")}
                      value={variant.price ?? ""}
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      onChange={(event) => onChangeVariant(index, "price", event.target.value)}
                    />
                    <TextField
                      label={t("السعر قبل الخصم")}
                      value={variant.compareAtPrice ?? ""}
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      onChange={(event) => onChangeVariant(index, "compareAtPrice", event.target.value)}
                    />
                    <TextField
                      label={t("المخزون")}
                      value={variant.stockQuantity ?? ""}
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "1" }}
                      onChange={(event) => onChangeVariant(index, "stockQuantity", event.target.value)}
                    />
                    <Box className="owner-variant-image">
                      <Typography variant="caption" color="text.secondary">{t("صورة النسخة")}</Typography>
                      <Box className="owner-variant-image__row">
                        <Box className="owner-variant-image__preview">
                          {variantImage ? (
                            <img
                              src={variantImage}
                              alt={t(variant.name || form.name || "variant")}
                            />
                          ) : (
                            <ImageRoundedIcon fontSize="small" />
                          )}
                        </Box>
                        <Box className="owner-variant-image__controls">
                          <input
                            className="owner-form__file owner-variant-image__input"
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.webp"
                            disabled={isVariantImageUploading}
                            onChange={(event) => {
                              onChangeVariantImageFile?.(
                                index,
                                Array.from(event.target.files || []),
                              );
                              event.target.value = "";
                            }}
                          />
                          {variantPreviewItems.length ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                {t(variantPreviewItems.map((item) => item.name).join("، "))}
                              </Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => onRemoveVariantImageFile?.(index)}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">{t("اختر صورة أو أكثر واحفظ الصنف")}</Typography>
                          )}
                        </Box>
                      </Box>

                      {variantImages.length ? (
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                          {variantImages.map((image) => (
                            <Chip
                              key={image.id || image.url}
                              size="small"
                              icon={<ImageRoundedIcon />}
                              label={t(image.isPrimary ? "صورة رئيسية" : "صورة محفوظة")}
                              onDelete={() => onDeleteExistingImage?.(image)}
                              disabled={deletingImageId === image.id}
                            />
                          ))}
                        </Stack>
                      ) : null}
                    </Box>
                    <TextField
                      label={t("الترتيب")}
                      value={variant.sortOrder ?? ""}
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "1" }}
                      onChange={(event) => onChangeVariant(index, "sortOrder", event.target.value)}
                    />
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {isEdit ? (
                        <AppButton
                          type="button"
                          size="small"
                          variant="contained"
                          startIcon={<SaveRoundedIcon fontSize="small" />}
                          loading={variantActionLoading === (variant.id || variant.localId)}
                          onClick={() => onSaveVariant(index)}
                        >
                          {t(isExistingVariant ? "حفظ تعديل الصنف" : "حفظ الصنف")}
                        </AppButton>
                      ) : null}
                      <AppButton
                        type="button"
                        size="small"
                        variant="text"
                        color="error"
                        startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                        loading={variantActionLoading === (variant.id || variant.localId)}
                        onClick={() => onRemoveVariant(index)}
                      >
                        {t(isExistingVariant ? "تعطيل" : "إزالة")}
                      </AppButton>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          ) : null}
        </Box>

        <Box className="owner-form__file-wrap owner-form__wide">
          <input
            className="owner-form__file"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(event) => onAppendImages(Array.from(event.target.files ?? []))}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip icon={<ImageRoundedIcon />} label={t("حتى 5MB للصورة")} />
            <Chip
              variant="outlined"
              label={t(isEdit
                  ? "يمكنك إضافة صور جديدة أو حذف الصور الحالية"
                  : "أول صورة ستصبح الصورة الرئيسية تلقائيًا")}
            />
            {categoryHint ? <Chip color="secondary" label={t(categoryHint)} /> : null}
          </Stack>
        </Box>

        {form.existingImages.length ? (
          <Box className="owner-form__wide">
            <Typography variant="subtitle2" className="owner-gallery__title">{t("الصور الحالية")}</Typography>
            <Box className="owner-gallery">
              {form.existingImages.map((image) => (
                <Box key={image.id} className="owner-gallery__item">
                  <img src={resolveAssetUrl(image.url)} alt={t(image.altText || form.name)} />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    className="owner-gallery__meta"
                  >
                    <Typography variant="caption">
                      {t(image.isPrimary ? "رئيسية" : "صورة")}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteExistingImage(image)}
                      disabled={deletingImageId === image.id}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}

        {newImagePreviews.length ? (
          <Box className="owner-form__wide">
            <Typography variant="subtitle2" className="owner-gallery__title">{t("الصور المضافة الآن")}</Typography>
            <Box className="owner-gallery">
              {newImagePreviews.map((image, index) => (
                <Box key={`${image.name}-${index}`} className="owner-gallery__item">
                  <img src={image.url} alt={t(image.name)} />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    className="owner-gallery__meta"
                  >
                    <Typography variant="caption">{t(image.name)}</Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveNewImage(index)}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}

        <Stack direction="row" spacing={1} className="owner-form__actions">
          <AppButton type="submit" variant="contained" loading={loading}>
            {t(isEdit ? "حفظ المنتج" : "إضافة المنتج")}
          </AppButton>
          {isEdit ? (
            <AppButton type="button" variant="outlined" onClick={onReset}>{t("إلغاء")}</AppButton>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
