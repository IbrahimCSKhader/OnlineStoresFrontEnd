export const STORE_THEME_TEMPLATES = [
  {
    value: "D",
    label: "القالب الافتراضي",
    description: "تصميم المتجر الحالي الهادئ مع وضع فاتح وداكن.",
  },
  {
    value: "P",
    label: "الثيم الوردي الفاخر",
    description: "Boutique ناعم ودافئ للهدایا والمنتجات اليدوية.",
  },
  {
    value: "B",
    label: "الثيم الأسود الفاخر",
    description: "واجهة داكنة راقية بتركيز قوي على الصور والمنتجات.",
  },
  {
    value: "F",
    label: "الثيم الأخضر الطبيعي",
    description: "تصميم أخضر دافئ مناسب للمنتجات الطبيعية والحرفية.",
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
