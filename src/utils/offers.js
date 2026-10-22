export function offerSavingsPercent(offer) {
  const regular = Number(offer?.regularPrice);
  const price = Number(offer?.bundlePrice);
  return Number.isFinite(regular) && regular > 0 && Number.isFinite(price)
    ? Math.max(0, Math.min(100, Math.round((regular - price) / regular * 100))) : 0;
}
