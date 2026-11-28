// This commissioned design belongs only to Alaa's storefront.
export const ALAA_STORE_SLUG = "alaa-rob";
export function isAlaaStore(store) {
  return String(store?.slug ?? store?.Slug ?? "").trim().toLowerCase() === ALAA_STORE_SLUG;
}
