export const STORE_THEME_TEMPLATES = [
  {
    value: "D",
    label: "رمادي",
    template: "default",
    lightVariant: "light",
    darkVariant: "dark",
    preview: {
      light: ["#F7F9FB", "#FFFFFF", "#0D1016"],
      dark: ["#101317", "#181D23", "#EEF2F6"],
    },
  },
  {
    value: "U",
    label: "أزرق",
    template: "blue",
    lightVariant: "blue",
    darkVariant: "blue-dark",
    preview: {
      light: ["#EEF7FF", "#F8FCFF", "#075DA8"],
      dark: ["#061626", "#102A43", "#6BE3F4"],
    },
  },
  {
    value: "F",
    label: "أخضر",
    template: "green",
    lightVariant: "nature",
    darkVariant: "nature-dark",
    preview: {
      light: ["#F7FBF5", "#FFFFFF", "#1F6F4A"],
      dark: ["#0D150F", "#18271B", "#BEE7C7"],
    },
  },
  {
    value: "P",
    label: "زهري",
    template: "pink",
    lightVariant: "pink",
    darkVariant: "pink-dark",
    preview: {
      light: ["#FFF7FB", "#FFFFFF", "#F05CA8"],
      dark: ["#21131C", "#321C2A", "#FF93C9"],
    },
  },
  {
    value: "B",
    label: "أسود",
    template: "black",
    lightVariant: "black-light",
    darkVariant: "black",
    preview: {
      light: ["#FAF7F0", "#FFFFFF", "#171717"],
      dark: ["#09090A", "#161618", "#F5E7C8"],
    },
  },
  {
    value: "N",
    label: "بني",
    template: "brown",
    lightVariant: "brown",
    darkVariant: "brown-dark",
    preview: {
      light: ["#FBF6EF", "#FFFFFF", "#7A4A28"],
      dark: ["#1D120B", "#2F2118", "#E6BE91"],
    },
  },
  {
    value: "V",
    label: "أرجواني",
    template: "purple",
    lightVariant: "purple",
    darkVariant: "purple-dark",
    preview: {
      light: ["#F8F4FF", "#FFFFFF", "#7251B5"],
      dark: ["#160E24", "#281B3E", "#CDB8FF"],
    },
  },
  {
    value: "Y",
    label: "ذهبي",
    template: "gold",
    lightVariant: "gold",
    darkVariant: "gold-dark",
    preview: {
      light: ["#FFF9E9", "#FFFFFF", "#A66F00"],
      dark: ["#1A1407", "#2D220C", "#F1C75B"],
    },
  },
  {
    value: "E",
    label: "أخضر غامق",
    template: "deep-green",
    lightVariant: "deep-green",
    darkVariant: "deep-green-dark",
    preview: {
      light: ["#F3FAF6", "#FFFFFF", "#0C5A43"],
      dark: ["#061411", "#102720", "#7AD4B2"],
    },
  },
  {
    value: "R",
    label: "أحمر",
    template: "red",
    lightVariant: "red",
    darkVariant: "red-dark",
    preview: {
      light: ["#FFF5F3", "#FFFFFF", "#C53A32"],
      dark: ["#220E0C", "#351815", "#FFB0A9"],
    },
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
