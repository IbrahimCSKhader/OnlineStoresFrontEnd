export const storageKeys = {
  authToken: "online-store.auth-token",
  authUser: "online-store.auth-user",
  authRole: "online-store.auth-role",
  themeVariant: "online-store.theme-variant",
  storeThemeVariants: "online-store.store-theme-variants",
  guestCart: "online-store.guest-cart",
};

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStorageItem(key, fallback = null) {
  if (!isBrowser()) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function setStorageItem(key, value) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    void error;
  }
}

export function removeStorageItem(key) {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    void error;
  }
}

export function getStorageJson(key, fallback = null) {
  const value = getStorageItem(key);

  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function setStorageJson(key, value) {
  setStorageItem(key, JSON.stringify(value));
}
