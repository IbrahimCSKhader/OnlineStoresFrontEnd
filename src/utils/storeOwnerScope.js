import { isOwnerRole } from "./roles.js";

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeSlug(value) {
  return normalizeValue(value).toLowerCase();
}

export function getOwnerSessionStoreScope(platformUser) {
  return {
    storeId: normalizeValue(
      platformUser?.storeId || platformUser?.StoreId || platformUser?.store?.id,
    ),
    storeSlug: normalizeSlug(
      platformUser?.storeSlug ||
        platformUser?.StoreSlug ||
        platformUser?.store?.slug,
    ),
  };
}

export function hasScopedOwnerSession({
  isPlatformAuthenticated = false,
  platformRole = "",
  platformUser = null,
} = {}) {
  const ownerScope = getOwnerSessionStoreScope(platformUser);

  return (
    isPlatformAuthenticated &&
    isOwnerRole(platformRole || platformUser?.accountType) &&
    Boolean(ownerScope.storeId || ownerScope.storeSlug)
  );
}

export function isOwnerSessionScopedToStore({
  isPlatformAuthenticated = false,
  platformRole = "",
  platformUser = null,
  storeId = "",
  storeSlug = "",
} = {}) {
  if (
    !hasScopedOwnerSession({
      isPlatformAuthenticated,
      platformRole,
      platformUser,
    })
  ) {
    return false;
  }

  const ownerScope = getOwnerSessionStoreScope(platformUser);
  const normalizedStoreId = normalizeValue(storeId);
  const normalizedStoreSlug = normalizeSlug(storeSlug);

  return (
    (Boolean(normalizedStoreId) && ownerScope.storeId === normalizedStoreId) ||
    (Boolean(normalizedStoreSlug) &&
      ownerScope.storeSlug === normalizedStoreSlug)
  );
}
