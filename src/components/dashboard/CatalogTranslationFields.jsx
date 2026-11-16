import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const languages = [{ value: "A", label: "العربية" }, { value: "E", label: "English" }, { value: "I", label: "עברית" }];

export default function CatalogTranslationFields({ store, form, onChange, product = false, disabled = false }) {
  if (!store?.enableLanguageSwitching) return null;
  const baseLanguage = store.defaultLanguage || store.language || "A";
  const options = languages.filter(({ value }) => value !== baseLanguage);
  const language = options.some(o => o.value === form.translationLanguage) ? form.translationLanguage : "";
  const translations = form.translations || [];
  const current = translations.find(t => t.language === language) || {};
  const update = (field, value) => onChange("translations", [
    ...translations.filter(t => t.language !== language),
    { ...current, language, [field]: value },
  ]);
  const fields = [["name", "الاسم", product ? 200 : 100], ["description", "الوصف", product ? 2000 : 500],
    ...(product ? [["shortDescription", "الوصف المختصر", 500]] : [])];
  return <Stack spacing={2} className="owner-form__wide">
    <TextField select size="small" label="عند تبديل اللغة إلى" value={language} disabled={disabled}
      onChange={event => onChange("translationLanguage", event.target.value)}>
      <MenuItem value="">بدون ترجمة إضافية</MenuItem>
      {options.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
    </TextField>
    {language && <Box sx={{ display: "grid", gap: 2 }}>
      <Typography variant="caption">الترجمة اختيارية. الحقول الفارغة تعرض النص الأصلي. يتم حفظ جميع اللغات عند حفظ النموذج.</Typography>
      {fields.map(([field, label, maxLength]) => <TextField key={field} size="small"
        label={`${label} — ${languages.find(l => l.value === language).label}`}
        value={current[field] || ""} onChange={event => update(field, event.target.value)} disabled={disabled}
        multiline={field !== "name"} minRows={field === "name" ? undefined : 2}
        inputProps={{ dir: language === "E" ? "ltr" : "rtl", maxLength }} />)}
    </Box>}
  </Stack>;
}
