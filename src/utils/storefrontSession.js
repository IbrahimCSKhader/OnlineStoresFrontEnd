import useAuthStore from "../store/authStore.js";
import { extractStorefrontCustomer } from "./authSession.js";
import { isStoreCustomerRole } from "./roles.js";

function normalizeStoreId(storeId) {
  return storeId ? String(storeId) : "";
}

function hasMatchingRole(checkRole, role, accountType) {
  return checkRole(role) || checkRole(accountType);
}

function resolveSessionStoreId(user) {
  return normalizeStoreId(user?.storeId || user?.StoreId || user?.store?.id);
}

export function getStorefrontSessionState(
  storeId,
  authState = useAuthStore.getState(),
) {
  const normalizedStoreId = normalizeStoreId(storeId);
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
  const hasScopedStorefrontSession =
    hasStorefrontCustomerSession &&
    (!normalizedStoreId ||
      !sessionStoreId ||
      sessionStoreId === normalizedStoreId);
  const hasConflictingStoreCustomerSession =
    isRegisteredStoreCustomer &&
    Boolean(normalizedStoreId) &&
    Boolean(sessionStoreId) &&
    sessionStoreId !== normalizedStoreId;

  return {
    normalizedStoreId,
    sessionStoreId,
    storefrontCustomer: extractStorefrontCustomer(user) || null,
    isRegisteredStoreCustomer,
    isGuestSession,
    hasStorefrontCustomerSession,
    hasScopedStorefrontSession,
    hasConflictingStoreCustomerSession,
    canAutoCreateGuestSession: false,
    useLocalGuestCart:
      Boolean(normalizedStoreId) && !hasScopedStorefrontSession,
  };
}

export async function ensureStorefrontGuestSession(storeId) {
  const normalizedStoreId = normalizeStoreId(storeId);
  return normalizedStoreId
    ? getStorefrontSessionState(normalizedStoreId)
    : null;
}
