export function formatCurrency(value, options = {}) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  const formatter = new Intl.NumberFormat("ar-PS", {
    style: "currency",
    currency: options.currency ?? "ILS",
    currencyDisplay: options.currencyDisplay ?? "narrowSymbol",
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  });

  return formatter.format(amount);
}

export default formatCurrency;
