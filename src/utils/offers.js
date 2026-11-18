export function offerSavingsPercent(offer) {
  const regular = Number(offer?.regularPrice);
  const price = Number(offer?.bundlePrice);
  return Number.isFinite(regular) && regular > 0 && Number.isFinite(price)
    ? Math.max(0, Math.min(100, Math.round((regular - price) / regular * 100))) : 0;
}

export const PREMIUM_OFFER_PRIORITY = 1000;

export function offerDate(value) {
  if (!value) return new Date(NaN);
  const text = String(value);
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(text) ? text : `${text}Z`);
}

export function isPremiumOffer(offer) {
  return Number(offer?.type) === 1 && Number(offer?.priority) >= PREMIUM_OFFER_PRIORITY;
}
