import { STORE_CUSTOMER_AUTH_MODE } from "./storeCustomerAuth.js";

const pendingGoogleAuthContextKey = "online-store.pending-google-auth-context";
const PENDING_GOOGLE_AUTH_CONTEXT_MAX_AGE_MS = 15 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeRedirectTo(value) {
  const path = normalizeValue(value);

  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/auth/google")) {
    return "";
  }

  return path;
}

function normalizeCreatedAt(value) {
  const createdAt = Number(value);
  return Number.isFinite(createdAt) && createdAt > 0 ? createdAt : Date.now();
}

function normalizeContext(value = {}) {
  const authMode =
    value?.authMode === STORE_CUSTOMER_AUTH_MODE ? STORE_CUSTOMER_AUTH_MODE : "";
  const storeId = normalizeValue(value?.storeId);
  const storeSlug = normalizeValue(value?.storeSlug);
  const storeName = normalizeValue(value?.storeName);
  const redirectTo = normalizeRedirectTo(value?.redirectTo);
  const createdAt = normalizeCreatedAt(value?.createdAt);

  if (!authMode && !storeId && !storeSlug && !redirectTo) {
    return null;
  }

  return {
    authMode,
    storeId,
    storeSlug,
    storeName,
    redirectTo,
    createdAt,
  };
}

function isExpired(context) {
  if (!context?.createdAt) {
    return true;
  }

  return Date.now() - context.createdAt > PENDING_GOOGLE_AUTH_CONTEXT_MAX_AGE_MS;
}

export function getPendingGoogleAuthContext() {
  if (!isBrowser()) return null;

  try {
    const rawValue = window.sessionStorage.getItem(pendingGoogleAuthContextKey);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    const normalizedContext = normalizeContext(parsedValue);

    if (!normalizedContext || isExpired(normalizedContext)) {
      clearPendingGoogleAuthContext();
      return null;
    }

    return normalizedContext;
  } catch {
    clearPendingGoogleAuthContext();
    return null;
  }
}

export function setPendingGoogleAuthContext(value) {
  if (!isBrowser()) return;

  const normalizedContext = normalizeContext({
    ...value,
    createdAt: Date.now(),
  });

  if (!normalizedContext) {
    clearPendingGoogleAuthContext();
    return;
  }

  try {
    window.sessionStorage.setItem(
      pendingGoogleAuthContextKey,
      JSON.stringify(normalizedContext),
    );
  } catch {
    // ignore storage access errors
  }
}

export function clearPendingGoogleAuthContext() {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.removeItem(pendingGoogleAuthContextKey);
  } catch {
    // ignore storage access errors
  }
}

export function isStoreScopedPendingGoogleAuthContext(context) {
  return (
    context?.authMode === STORE_CUSTOMER_AUTH_MODE ||
    Boolean(context?.storeId) ||
    Boolean(context?.storeSlug)
  );
}
