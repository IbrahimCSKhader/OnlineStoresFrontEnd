const COUPONS_DISABLED_STORE_ID = "a601be8d-8d2d-4a79-b0e2-272490194669";

export function canUseStoreCoupons(store) {
  return !store?.isCatalog && String(store?.id || "").toLowerCase() !== COUPONS_DISABLED_STORE_ID;
}
