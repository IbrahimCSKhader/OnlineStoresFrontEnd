import {
  UI_PALESTINE_ARABIC_LATIN_LOCALE,
  toEnglishDigits,
} from "./numberFormat.js";

export function formatCurrency(value, options = {}) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  const formatter = new Intl.NumberFormat(
    options.locale ?? UI_PALESTINE_ARABIC_LATIN_LOCALE,
    {
    style: "currency",
    currency: options.currency ?? "ILS",
    currencyDisplay: options.currencyDisplay ?? "narrowSymbol",
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    },
  );

  return toEnglishDigits(formatter.format(amount));
}

export default formatCurrency;
