export const DEFAULT_STOREFRONT_LANGUAGE = "A";

export const STOREFRONT_LANGUAGES = {
  A: {
    code: "A",
    apiValue: "A",
    locale: "ar",
    dir: "rtl",
    label: "العربية",
    shortLabel: "AR",
    copy: {
      home: "الرئيسية",
      products: "المنتجات",
      about: "من نحن",
      contact: "تواصل",
      market: "المتاجر",
      cart: "السلة",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      account: "الحساب",
      navigation: "التنقل",
      support: "الدعم",
      language: "اللغة",
      dashboard: "لوحة الإدارة",
      ownerDashboard: "إدارة المتجر",
      storefront: "واجهة المتجر",
      logout: "تسجيل الخروج",
      createStore: "أنشئ متجرك",
      previewCartDisabled: "السلة معطلة في وضع المعاينة",
    },
  },
  E: {
    code: "E",
    apiValue: "E",
    locale: "en",
    dir: "ltr",
    label: "English",
    shortLabel: "EN",
    copy: {
      home: "Home",
      products: "Products",
      about: "About",
      contact: "Contact",
      market: "Stores",
      cart: "Cart",
      login: "Log in",
      register: "Create account",
      account: "Account",
      navigation: "Navigation",
      support: "Support",
      language: "Language",
      dashboard: "Admin dashboard",
      ownerDashboard: "Manage store",
      storefront: "Storefront",
      logout: "Log out",
      createStore: "Create your store",
      previewCartDisabled: "Cart is disabled in preview mode",
    },
  },
  I: {
    code: "I",
    apiValue: "I",
    locale: "he",
    dir: "rtl",
    label: "עברית",
    shortLabel: "HE",
    copy: {
      home: "בית",
      products: "מוצרים",
      about: "אודות",
      contact: "יצירת קשר",
      market: "חנויות",
      cart: "עגלה",
      login: "כניסה",
      register: "יצירת חשבון",
      account: "חשבון",
      navigation: "ניווט",
      support: "תמיכה",
      language: "שפה",
      dashboard: "לוח ניהול",
      ownerDashboard: "ניהול החנות",
      storefront: "חזית החנות",
      logout: "יציאה",
      createStore: "יצירת חנות",
      previewCartDisabled: "העגלה מושבתת במצב תצוגה מקדימה",
    },
  },
};

export const STOREFRONT_LANGUAGE_OPTIONS = Object.values(STOREFRONT_LANGUAGES);

export function normalizeStorefrontLanguage(value) {
  const normalized = String(value || "").trim().toUpperCase();

  if (normalized === "AR" || normalized === "ARA" || normalized === "ARABIC") {
    return "A";
  }

  if (normalized === "EN" || normalized === "ENG" || normalized === "ENGLISH") {
    return "E";
  }

  if (
    normalized === "HE" ||
    normalized === "HEB" ||
    normalized === "HEBREW" ||
    normalized === "IVRIT"
  ) {
    return "I";
  }

  return STOREFRONT_LANGUAGES[normalized]
    ? normalized
    : DEFAULT_STOREFRONT_LANGUAGE;
}

export function getStorefrontLanguage(value) {
  return STOREFRONT_LANGUAGES[normalizeStorefrontLanguage(value)];
}
