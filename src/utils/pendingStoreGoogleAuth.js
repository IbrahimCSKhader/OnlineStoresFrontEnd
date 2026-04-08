const pendingStoreGoogleAuthKey = "online-store.pending-store-google-auth";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getPendingStoreGoogleAuth() {
  if (!isBrowser()) return null;

  try {
    const rawValue = window.sessionStorage.getItem(pendingStoreGoogleAuthKey);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
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
