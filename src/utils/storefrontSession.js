import useAuthStore from "../store/authStore.js";
import { extractStorefrontCustomer } from "./authSession.js";
import { isStoreCustomerRole } from "./roles.js";

function normalizeStoreId(storeId) {
  return storeId ? String(storeId) : "";
}

function normalizeStoreSlug(storeSlug) {
  return storeSlug ? String(storeSlug).trim().toLowerCase() : "";
}

function hasMatchingRole(checkRole, role, accountType) {
  return checkRole(role) || checkRole(accountType);
}

function resolveSessionStoreId(user) {
  return normalizeStoreId(user?.storeId || user?.StoreId || user?.store?.id);
}

function resolveSessionStoreSlug(user) {
  return normalizeStoreSlug(
    user?.storeSlug || user?.StoreSlug || user?.store?.slug,
  );
}

export function getStorefrontSessionState(
  storeId,
  storeSlug = "",
  authState = useAuthStore.getState(),
) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const normalizedStoreSlug = normalizeStoreSlug(storeSlug);
  const storefrontSession = authState?.storefrontSession ?? {};
  const role = authState?.storefrontRole || storefrontSession?.role;
  const user =
    authState?.storefrontCustomer ||
    extractStorefrontCustomer(authState?.storefrontUser) ||
    authState?.storefrontUser ||
    extractStorefrontCustomer(storefrontSession?.user) ||
    storefrontSession?.user;
  const accountType =
    user?.accountType ||
    authState?.storefrontUser?.accountType ||
    storefrontSession?.user?.accountType;
  const storefrontCustomer = extractStorefrontCustomer(user);
  const isRegisteredStoreCustomer =
    Boolean(storefrontCustomer) ||
    hasMatchingRole(isStoreCustomerRole, role, accountType);
  const isGuestSession = false;
  const hasStorefrontCustomerSession = isRegisteredStoreCustomer;
  const sessionStoreId = resolveSessionStoreId(storefrontCustomer || user);
  const sessionStoreSlug = resolveSessionStoreSlug(storefrontCustomer || user);
  const hasRequestedStoreScope = Boolean(
    normalizedStoreId || normalizedStoreSlug,
  );
  const hasMatchingStoreId =
    Boolean(normalizedStoreId) &&
    Boolean(sessionStoreId) &&
    sessionStoreId === normalizedStoreId;
  const hasMatchingStoreSlug =
    Boolean(normalizedStoreSlug) &&
    Boolean(sessionStoreSlug) &&
    sessionStoreSlug === normalizedStoreSlug;
  const hasScopedStorefrontSession =
    hasStorefrontCustomerSession &&
    (hasRequestedStoreScope
      ? hasMatchingStoreId || hasMatchingStoreSlug
      : !sessionStoreId && !sessionStoreSlug);
  const hasConflictingStoreCustomerSession =
    isRegisteredStoreCustomer &&
    (
      (Boolean(normalizedStoreId) &&
        Boolean(sessionStoreId) &&
        sessionStoreId !== normalizedStoreId) ||
      (Boolean(normalizedStoreSlug) &&
        Boolean(sessionStoreSlug) &&
        sessionStoreSlug !== normalizedStoreSlug)
    );

  return {
    normalizedStoreId,
    normalizedStoreSlug,
    sessionStoreId,
    sessionStoreSlug,
    storefrontCustomer: extractStorefrontCustomer(user) || null,
    isRegisteredStoreCustomer,
    isGuestSession,
    hasStorefrontCustomerSession,
    hasScopedStorefrontSession,
    hasConflictingStoreCustomerSession,
    canAutoCreateGuestSession: false,
    useLocalGuestCart:
      hasRequestedStoreScope && !hasScopedStorefrontSession,
  };
}

export async function ensureStorefrontGuestSession(storeId, storeSlug = "") {
  const normalizedStoreId = normalizeStoreId(storeId);
  const normalizedStoreSlug = normalizeStoreSlug(storeSlug);
  return normalizedStoreId || normalizedStoreSlug
    ? getStorefrontSessionState(normalizedStoreId, normalizedStoreSlug)
    : null;
}
