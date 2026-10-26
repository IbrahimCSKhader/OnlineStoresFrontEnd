// This registry is shared by the editor, preview and storefront resolver.
export const APPEARANCE_FONTS = ["Arial", "Tahoma", "Verdana", "Georgia", "Roboto", "sans-serif", "serif"];
export const APPEARANCE_FIELDS = [
  ["primary", "اللون الرئيسي", "color", "عام", "--primary"],
  ["secondary", "اللون الثانوي", "color", "عام", "--secondary"],
  ["background", "خلفية الصفحة", "color", "عام", "--background"],
  ["surface", "خلفية المساحات", "color", "عام", "--surface"],
  ["textPrimary", "النص الرئيسي", "color", "عام", "--text-primary"],
  ["textSecondary", "النص الثانوي", "color", "عام", "--text-secondary"],
  ["border", "الحدود", "color", "عام", "--border-subtle"],
  ["fontFamily", "الخط العام", "font", "عام", "--font-body"],
  ["headingFontFamily", "خط العناوين", "font", "عام", "--font-heading"],
  ["fontSize", "حجم النص العام", "size", "عام"],
  ["headerBackground", "خلفية الشريط العلوي", "color", "الشريط العلوي", "--nav-background"],
  ["headerText", "نص الشريط العلوي", "color", "الشريط العلوي"],
  ["storeTitleColor", "لون عنوان المتجر", "color", "عنوان المتجر"],
  ["storeTitleFontFamily", "خط عنوان المتجر", "font", "عنوان المتجر"],
  ["storeTitleFontSize", "حجم عنوان المتجر", "size", "عنوان المتجر"],
  ["storeDescriptionColor", "لون وصف المتجر", "color", "وصف المتجر"],
  ["storeDescriptionFontFamily", "خط وصف المتجر", "font", "وصف المتجر"],
  ["storeDescriptionFontSize", "حجم وصف المتجر", "size", "وصف المتجر"],
  ["buttonBackground", "خلفية الأزرار الرئيسية", "color", "الأزرار"],
  ["buttonText", "نص الأزرار الرئيسية", "color", "الأزرار", "--button-text"],
  ["buttonFontFamily", "خط الأزرار", "font", "الأزرار"],
  ["buttonFontSize", "حجم خط الأزرار", "size", "الأزرار"],
  ["productCardBackground", "خلفية بطاقة المنتج", "color", "المنتجات"],
  ["productTitleColor", "لون اسم المنتج", "color", "المنتجات"],
  ["productTitleFontFamily", "خط اسم المنتج", "font", "المنتجات"],
  ["productTitleFontSize", "حجم اسم المنتج", "size", "المنتجات"],
  ["priceColor", "لون السعر", "color", "الأسعار"],
  ["priceFontFamily", "خط السعر", "font", "الأسعار"],
  ["priceFontSize", "حجم السعر", "size", "الأسعار"],
].map(([key, label, type, group, cssVar]) => ({ key, label, type, group, cssVar }));

export function validAppearanceValue(field, value) {
  if (typeof value !== "string") return false;
  if (field.type === "color") return /^#[\da-f]{6}$/i.test(value);
  if (field.type === "font") return APPEARANCE_FONTS.includes(value);
  return /^\d{2}px$/.test(value) && parseInt(value) >= 10 && parseInt(value) <= 96;
}

export function safeAppearance(values) {
  return Object.fromEntries(APPEARANCE_FIELDS.filter((f) => validAppearanceValue(f, values?.[f.key])).map((f) => [f.key, values[f.key]]));
}

export function applyAppearanceProfile(profile, appearance) {
  const values = safeAppearance(appearance?.[profile.mode]);
  if (!Object.keys(values).length) return profile;
  const palette = { ...profile.palette };
  const cssVars = { ...profile.cssVars };
  for (const field of APPEARANCE_FIELDS) {
    const value = values[field.key];
    if (!value) continue;
    if (field.cssVar) cssVars[field.cssVar] = value;
    if (Object.hasOwn(palette, field.key)) palette[field.key] = value;
  }
  if (values.border) palette.ghostBorder = values.border;
  if (values.headerBackground) cssVars["--nav-glass"] = values.headerBackground;
  // Derived primary surfaces change only when the primary itself is overridden.
  if (values.primary) {
    palette.primaryContainer = values.primary;
    cssVars["--primary-container"] = values.primary;
    cssVars["--cta-gradient"] = values.primary;
  }
  if (values.background) cssVars["--gradient-page"] = values.background;
  return { ...profile, palette, cssVars };
}

const title = ".page-store-details__title";
const description = ".page-store-details__hero .storefront-subtitle";
const product = ":is(.product-card__title, .storefront-product-card__name, .page-product-details__title)";
const price = ":is(.product-card__price, .storefront-product-card__price, .page-product-details__price)";
const button = ".MuiButton-root";
const filledButton = ".MuiButton-containedPrimary";
const card = ":is(.product-card, .storefront-product-card)";
const header = ".store-navbar";
const targets = {
  background: ["&", "background"],
  fontFamily: ["&, & .MuiTypography-root, & input, & select, & textarea", "font-family"],
  headingFontFamily: ["& :is(h1,h2,h3,h4,h5,h6), & :is(h1,h2,h3,h4,h5,h6).MuiTypography-root", "font-family"],
  fontSize: ["&, & :is(p, input, select, textarea, .MuiTypography-body1, .MuiTypography-body2)", "font-size"],
  border: ["& :is(.MuiPaper-root, .MuiOutlinedInput-notchedOutline, .product-card, .storefront-product-card)", "border-color"],
  headerBackground: [`& ${header}`, "background"],
  headerText: [`& ${header}, & ${header} :is(a, button, .MuiTypography-root)`, "color"],
  buttonBackground: [`& ${filledButton}`, "background"],
  buttonText: [`& ${filledButton}`, "color"],
  buttonFontFamily: [`& ${button}`, "font-family"],
  buttonFontSize: [`& ${button}`, "font-size"],
  productCardBackground: [`& ${card}`, "background"],
};
for (const [prefix, selector] of [["storeTitle", title], ["storeDescription", description], ["productTitle", product], ["price", price]]) {
  for (const [suffix, property] of [["Color", "color"], ["FontFamily", "font-family"], ["FontSize", "font-size"]]) {
    targets[`${prefix}${suffix}`] = [`& ${selector}`, property];
  }
}

// Emit rules only for explicit overrides: original CSS stays completely intact otherwise.
export function buildAppearanceCss(overrides, scope = ".store-layout") {
  return Object.entries(safeAppearance(overrides)).filter(([key]) => targets[key]).map(([key, value]) => {
    const [selector, property] = targets[key];
    return `${selector.replaceAll("&", scope)} { ${property}: ${value} !important; }`;
  }).join("\n");
}

export function contrastRatio(a, b) {
  const luminance = (color) => {
    const rgb = color.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255)
      .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  if (!/^#[\da-f]{6}$/i.test(a) || !/^#[\da-f]{6}$/i.test(b)) return null;
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
