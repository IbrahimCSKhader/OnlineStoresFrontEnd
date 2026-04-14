const pendingStoreGoogleAuthKey = "online-store.pending-store-google-auth";
const PENDING_STORE_GOOGLE_AUTH_MAX_AGE_MS = 15 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getPendingStoreGoogleAuth() {
  if (!isBrowser()) return null;

  try {
    const rawValue = window.sessionStorage.getItem(pendingStoreGoogleAuthKey);
    const parsedValue = rawValue ? JSON.parse(rawValue) : null;

    if (!parsedValue) {
      return null;
    }

    const createdAt = Number(parsedValue?.createdAt || 0);
    const isExpired =
      !Number.isFinite(createdAt) ||
      createdAt <= 0 ||
      Date.now() - createdAt > PENDING_STORE_GOOGLE_AUTH_MAX_AGE_MS;

    if (isExpired) {
      clearPendingStoreGoogleAuth();
      return null;
    }

    return parsedValue;
  } catch {
    clearPendingStoreGoogleAuth();
    return null;
  }
}

export function setPendingStoreGoogleAuth(value) {
  if (!isBrowser()) return;

  if (!value) {
    clearPendingStoreGoogleAuth();
    return;
  }

  try {
    window.sessionStorage.setItem(
      pendingStoreGoogleAuthKey,
      JSON.stringify({
        appUserToken: value.appUserToken || "",
        email: value.email || "",
        storeId: value.storeId || "",
        storeSlug: value.storeSlug || "",
        storeName: value.storeName || "",
        redirectTo: value.redirectTo || "",
        createdAt: Date.now(),
      }),
    );
  } catch {
    // ignore storage access errors
  }
}

export function clearPendingStoreGoogleAuth() {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.removeItem(pendingStoreGoogleAuthKey);
  } catch {
    // ignore storage access errors
  }
}
