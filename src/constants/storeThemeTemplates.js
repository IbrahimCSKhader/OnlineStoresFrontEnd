export const STORE_THEME_TEMPLATES = [
  {
    value: "D",
    label: "القالب الافتراضي",
    description: "تصميم هادئ يدعم ثيم صباحي وثيم ليلي داخل واجهة المتجر.",
  },
  {
    value: "U",
    label: "القالب الأزرق",
    description: "تصميم أزرق بحري يدعم ثيم صباحي وثيم ليلي داخل واجهة المتجر.",
  },
  {
    value: "P",
    label: "الثيم الوردي الفاخر",
    description: "Boutique ناعم ودافئ يدعم ثيم صباحي وثيم ليلي.",
  },
  {
    value: "B",
    label: "الثيم الأسود الفاخر",
    description: "واجهة راقية تدعم ثيم صباحي وثيم ليلي.",
  },
  {
    value: "F",
    label: "الثيم الأخضر الطبيعي",
    description: "تصميم أخضر دافئ يدعم ثيم صباحي وثيم ليلي.",
  },
];

export function normalizeStoreThemeTemplate(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .toUpperCase();

  return STORE_THEME_TEMPLATES.some((template) => template.value === normalizedValue)
    ? normalizedValue
    : "D";
}

export function getStoreThemeTemplateLabel(value) {
  const normalizedValue = normalizeStoreThemeTemplate(value);
  return (
    STORE_THEME_TEMPLATES.find((template) => template.value === normalizedValue)?.label ||
    STORE_THEME_TEMPLATES[0].label
  );
}
