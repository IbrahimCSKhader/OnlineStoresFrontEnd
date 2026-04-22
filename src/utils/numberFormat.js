export const UI_ARABIC_LATIN_LOCALE = "ar-u-nu-latn";
export const UI_PALESTINE_ARABIC_LATIN_LOCALE = "ar-PS-u-nu-latn";

const ARABIC_INDIC_DIGITS = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

const ARABIC_INDIC_DIGITS_PATTERN = /[٠-٩۰-۹]/g;

export function toEnglishDigits(value) {
  return String(value ?? "").replace(
    ARABIC_INDIC_DIGITS_PATTERN,
    (digit) => ARABIC_INDIC_DIGITS[digit] || digit,
  );
}

export function formatUiNumber(value, options = {}, fallback = 0) {
  const amount = Number(value ?? fallback);

  if (!Number.isFinite(amount)) {
    return toEnglishDigits(fallback);
  }

  return toEnglishDigits(
    amount.toLocaleString(UI_ARABIC_LATIN_LOCALE, options),
  );
}

export function formatUiDateTime(value, options = {}) {
  if (!value) {
    return "-";
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return "-";
  }

  return toEnglishDigits(
    parsedValue.toLocaleString(UI_ARABIC_LATIN_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    }),
  );
}

export function formatUiDate(value, options = {}) {
  if (!value) {
    return "-";
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return "-";
  }

  return toEnglishDigits(
    parsedValue.toLocaleDateString(UI_ARABIC_LATIN_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    }),
  );
}
