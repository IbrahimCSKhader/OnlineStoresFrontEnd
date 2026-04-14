const pendingGoogleCallbackResultKey = "online-store.pending-google-callback-result";
const PENDING_GOOGLE_CALLBACK_RESULT_MAX_AGE_MS = 5 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeSessionType(value) {
  const sessionType = normalizeValue(value).toLowerCase();

  if (sessionType === "platform" || sessionType === "storefront" || sessionType === "pending") {
    return sessionType;
  }

  return "";
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

function normalizeCallbackResult(value = {}) {
  const sessionType = normalizeSessionType(value?.sessionType);
  const redirectTo = normalizeRedirectTo(value?.redirectTo);
  const storeId = normalizeValue(value?.storeId);
  const storeSlug = normalizeValue(value?.storeSlug);
  const createdAt = normalizeCreatedAt(value?.createdAt);

  if (!sessionType) {
    return null;
  }

  return {
    sessionType,
    redirectTo,
    storeId,
    storeSlug,
    createdAt,
  };
}

function isExpired(value) {
  if (!value?.createdAt) {
    return true;
  }

  return Date.now() - value.createdAt > PENDING_GOOGLE_CALLBACK_RESULT_MAX_AGE_MS;
}

export function getPendingGoogleCallbackResult() {
  if (!isBrowser()) return null;

  try {
    const rawValue = window.sessionStorage.getItem(pendingGoogleCallbackResultKey);
    if (!rawValue) {
      return null;
    }

    const normalizedValue = normalizeCallbackResult(JSON.parse(rawValue));

    if (!normalizedValue || isExpired(normalizedValue)) {
      clearPendingGoogleCallbackResult();
      return null;
    }

    return normalizedValue;
  } catch {
    clearPendingGoogleCallbackResult();
    return null;
  }
}

export function setPendingGoogleCallbackResult(value) {
  if (!isBrowser()) return;

  const normalizedValue = normalizeCallbackResult({
    ...value,
    createdAt: Date.now(),
  });

  if (!normalizedValue) {
    clearPendingGoogleCallbackResult();
    return;
  }

  try {
    window.sessionStorage.setItem(
      pendingGoogleCallbackResultKey,
      JSON.stringify(normalizedValue),
    );
  } catch {
    // ignore storage access errors
  }
}

export function clearPendingGoogleCallbackResult() {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.removeItem(pendingGoogleCallbackResultKey);
  } catch {
    // ignore storage access errors
  }
}
