export const STORE_CUSTOMER_AUTH_MODE = "store-customer";

export function buildStoreCustomerAuthState({
  storeId,
  storeSlug = "",
  storeName = "",
  redirectTo = "",
} = {}) {
  return {
    authMode: STORE_CUSTOMER_AUTH_MODE,
    storeId: storeId || "",
    storeSlug,
    storeName,
    redirectTo: redirectTo || (storeSlug ? `/market/${storeSlug}` : "/market"),
  };
}

export function isStoreCustomerAuthMode(state) {
  return state?.authMode === STORE_CUSTOMER_AUTH_MODE;
}

export function hasStoreCustomerAuthContext(state) {
  return isStoreCustomerAuthMode(state) && Boolean(state?.storeId);
}

export function getStoreCustomerRedirectPath(state) {
  return state?.redirectTo || (state?.storeSlug ? `/market/${state.storeSlug}` : "/market");
}
