import { extractRole, extractToken, extractUser } from "./authSession.js";
import { isOwnerRole, isStoreCustomerRole } from "./roles.js";

export const STORE_CUSTOMER_AUTH_MODE = "store-customer";

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeLowercaseValue(value) {
  return normalizeValue(value).toLowerCase();
}

function resolveStoreAuthResponseStoreId(data = {}, user = {}) {
  return normalizeValue(
    data?.storeId ||
      data?.StoreId ||
      data?.data?.storeId ||
      data?.data?.StoreId ||
      user?.storeId ||
      user?.StoreId ||
      user?.store?.id,
  );
}

function resolveStoreAuthResponseStoreSlug(data = {}, user = {}) {
  return normalizeValue(
    data?.storeSlug ||
      data?.StoreSlug ||
      data?.data?.storeSlug ||
      data?.data?.StoreSlug ||
      user?.storeSlug ||
      user?.StoreSlug ||
      user?.store?.slug,
  );
}

function resolveStoreAuthResponseStoreName(data = {}, user = {}) {
  return normalizeValue(
    data?.storeName ||
      data?.StoreName ||
      data?.data?.storeName ||
      data?.data?.StoreName ||
      user?.storeName ||
      user?.StoreName ||
      user?.store?.name,
  );
}

function resolveStoreAuthResponseStoreCustomerId(data = {}, user = {}) {
  return normalizeValue(
    data?.storeCustomerId ||
      data?.StoreCustomerId ||
      data?.customerStoreId ||
      data?.CustomerStoreId ||
      data?.data?.storeCustomerId ||
      data?.data?.StoreCustomerId ||
      data?.data?.customerStoreId ||
      data?.data?.CustomerStoreId ||
      user?.storeCustomerId ||
      user?.customerStoreId ||
      user?.CustomerStoreId,
  );
}

function sanitizeStoreScopedUser(user, authResult) {
  if (!user) {
    return null;
  }

  const nextUser = applyStoreScopeToUser(user, {
    storeId: authResult.responseStoreId,
    storeSlug: authResult.responseStoreSlug,
    storeName: authResult.responseStoreName,
  });

  if (authResult.responseStoreId) {
    nextUser.storeId = authResult.responseStoreId;
  }

  if (authResult.isOwner) {
    nextUser.storeCustomerId = "";
    return nextUser;
  }

  if (authResult.isCustomer) {
    nextUser.storeCustomerId = normalizeValue(
      authResult.responseStoreCustomerId || nextUser.storeCustomerId || nextUser.id,
    );
  }

  return nextUser;
}

export function applyStoreScopeToUser(
  user,
  { storeId = "", storeSlug = "", storeName = "" } = {},
) {
  if (!user) {
    return null;
  }

  const normalizedStoreId = normalizeValue(storeId);
  const normalizedStoreSlug = normalizeValue(storeSlug);
  const normalizedStoreName = normalizeValue(storeName);
  const nextUser = { ...user };
  const nextStore =
    nextUser.store && typeof nextUser.store === "object" ? { ...nextUser.store } : {};

  if (normalizedStoreId) {
    nextUser.storeId = normalizedStoreId;
    nextStore.id = normalizedStoreId;
  }

  if (normalizedStoreSlug) {
    nextUser.storeSlug = normalizedStoreSlug;
    nextStore.slug = normalizedStoreSlug;
  }

  if (normalizedStoreName) {
    nextUser.storeName = normalizedStoreName;
    nextStore.name = normalizedStoreName;
  }

  if (
    normalizedStoreId ||
    normalizedStoreSlug ||
    normalizedStoreName ||
    Object.keys(nextStore).length
  ) {
    nextUser.store = nextStore;
  }

  return nextUser;
}

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
    redirectTo: redirectTo || (storeSlug ? `/market/${storeSlug}` : "/"),
  };
}

export function isStoreCustomerAuthMode(state) {
  return state?.authMode === STORE_CUSTOMER_AUTH_MODE;
}

export function hasStoreCustomerAuthContext(state) {
  return (
    isStoreCustomerAuthMode(state) &&
    (Boolean(state?.storeId) || Boolean(state?.storeSlug))
  );
}

export function getStoreCustomerRedirectPath(state) {
  return state?.redirectTo || (state?.storeSlug ? `/market/${state.storeSlug}` : "/");
}

export function resolveStoreCustomerDashboard(data = {}, user = {}, role = "") {
  const dashboardValue = normalizeValue(
    data?.dashboard ||
      data?.Dashboard ||
      data?.data?.dashboard ||
      data?.data?.Dashboard,
  ).toLowerCase();

  if (dashboardValue === "owner") return "owner";
  if (dashboardValue === "customer") return "customer";

  const accountType = normalizeValue(
    data?.accountType ||
      data?.AccountType ||
      data?.data?.accountType ||
      data?.data?.AccountType ||
      user?.accountType ||
      user?.AccountType,
  );

  if (isOwnerRole(accountType) || isOwnerRole(role)) {
    return "owner";
  }

  if (isStoreCustomerRole(accountType) || isStoreCustomerRole(role)) {
    return "customer";
  }

  return "";
}

export function resolveStoreScopedAuthResult(data = {}, requestedStoreId = "") {
  const token = extractToken(data);
  const extractedUser = extractUser(data, token);
  const role = extractRole(data, token, extractedUser);
  const dashboard = resolveStoreCustomerDashboard(data, extractedUser, role);
  const responseSessionScope = normalizeLowercaseValue(
    data?.sessionScope ||
      data?.SessionScope ||
      data?.data?.sessionScope ||
      data?.data?.SessionScope,
  );
  const responseAuthMode = normalizeLowercaseValue(
    data?.authMode ||
      data?.AuthMode ||
      data?.data?.authMode ||
      data?.data?.AuthMode,
  );
  const responseStoreId = resolveStoreAuthResponseStoreId(data, extractedUser);
  const responseStoreSlug = resolveStoreAuthResponseStoreSlug(data, extractedUser);
  const responseStoreName = resolveStoreAuthResponseStoreName(data, extractedUser);
  const responseStoreCustomerId = resolveStoreAuthResponseStoreCustomerId(
    data,
    extractedUser,
  );
  const normalizedRequestedStoreId = normalizeValue(requestedStoreId);
  const isOwner =
    responseSessionScope === "platform" ||
    dashboard === "owner" ||
    isOwnerRole(role) ||
    isOwnerRole(extractedUser?.accountType);
  const isCustomer =
    !isOwner &&
    (
      responseSessionScope === "storefront" ||
      responseAuthMode === STORE_CUSTOMER_AUTH_MODE ||
      dashboard === "customer" ||
      isStoreCustomerRole(role) ||
      isStoreCustomerRole(extractedUser?.accountType) ||
      Boolean(responseStoreCustomerId)
    );
  const belongsToRequestedStore =
    !normalizedRequestedStoreId ||
    (Boolean(responseStoreId) && responseStoreId === normalizedRequestedStoreId);
  const result = {
    data,
    token,
    role,
    dashboard,
    requestStoreId: normalizedRequestedStoreId,
    responseStoreId,
    responseStoreSlug,
    responseStoreName,
    responseStoreCustomerId: isCustomer ? responseStoreCustomerId : "",
    isOwner,
    isCustomer,
    belongsToRequestedStore,
    authMode: responseAuthMode,
    sessionScope:
      responseSessionScope || (isOwner ? "platform" : isCustomer ? "storefront" : ""),
  };

  return {
    ...result,
    user: sanitizeStoreScopedUser(extractedUser, result),
  };
}

export function applyRequestedStoreScopeFallback(result, requestedStoreId = "") {
  const normalizedRequestedStoreId = normalizeValue(requestedStoreId);
  const resolvedStoreCustomerId = normalizeValue(
    result?.responseStoreCustomerId ||
      result?.user?.storeCustomerId ||
      result?.user?.customerStoreId ||
      result?.user?.CustomerStoreId,
  );

  if (
    !normalizedRequestedStoreId ||
    !result?.isCustomer ||
    result?.responseStoreId ||
    !resolvedStoreCustomerId
  ) {
    return result;
  }

  return {
    ...result,
    responseStoreId: normalizedRequestedStoreId,
    belongsToRequestedStore: true,
    user: result?.user
      ? applyStoreScopeToUser(result.user, {
          storeId: normalizedRequestedStoreId,
          storeSlug: result?.responseStoreSlug,
          storeName: result?.responseStoreName,
        })
      : result?.user,
  };
}

function buildStoreScopedAuthError(code) {
  const messages = {
    STORE_SCOPE_UNRESOLVED:
      "Store could not be verified from the authentication response.",
    STORE_SCOPE_MISMATCH:
      "Store context mismatch. Please login again for the current store.",
    STORE_MEMBERSHIP_REQUIRED:
      "This account is not a store owner or store customer for the current store.",
  };
  const error = new Error(messages[code] || "Invalid store authentication response.");
  error.code = code;
  return error;
}

export function assertStoreScopedAuthResult(result) {
  if (!result?.requestStoreId) {
    return result;
  }

  if (!result.responseStoreId) {
    throw buildStoreScopedAuthError("STORE_SCOPE_UNRESOLVED");
  }

  if (result.responseStoreId !== result.requestStoreId) {
    throw buildStoreScopedAuthError("STORE_SCOPE_MISMATCH");
  }

  if (!result.isOwner && !result.isCustomer) {
    throw buildStoreScopedAuthError("STORE_MEMBERSHIP_REQUIRED");
  }

  return result;
}
