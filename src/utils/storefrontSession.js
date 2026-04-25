import useAuthStore from "../store/authStore.js";
import { extractStorefrontCustomer } from "./authSession.js";
import { isStoreCustomerRole } from "./roles.js";
import {
  doesStorefrontSessionMatchScope,
  findStorefrontAuthSessionInCollection,
  normalizeStoreScope,
  normalizeStorefrontAuthSession,
} from "./token.js";

function hasMatchingRole(checkRole, role, accountType) {
  return checkRole(role) || checkRole(accountType);
}

function resolveSessionStoreId(user, session) {
  return normalizeStoreScope({
    storeId: session?.storeId || user?.storeId || user?.StoreId || user?.store?.id,
  }).storeId;
}

function resolveSessionStoreSlug(user, session) {
  return normalizeStoreScope({
    storeSlug:
      session?.storeSlug ||
      user?.storeSlug ||
      user?.StoreSlug ||
      user?.store?.slug,
  }).storeSlug;
}

function resolveScopedStorefrontSession(authState, normalizedScope) {
  const authStorefrontSession = normalizeStorefrontAuthSession(
    authState?.storefrontSession,
    normalizedScope,
  );
  const matchedStoredSession =
    findStorefrontAuthSessionInCollection(
      authState?.storefrontSessions,
      normalizedScope,
    )?.[1] || null;

  if (matchedStoredSession) {
    return normalizeStorefrontAuthSession(matchedStoredSession, normalizedScope);
  }

  if (doesStorefrontSessionMatchScope(authStorefrontSession, normalizedScope)) {
    return authStorefrontSession;
  }

  return normalizeStorefrontAuthSession({}, normalizedScope);
}

export function getStorefrontSessionState(
  storeId,
  storeSlug = "",
  authState = useAuthStore.getState(),
) {
  const normalizedScope = normalizeStoreScope({ storeId, storeSlug });
  const storefrontSession = resolveScopedStorefrontSession(
    authState,
    normalizedScope,
  );
  const role = storefrontSession?.role || storefrontSession?.user?.accountType;
  const user =
    extractStorefrontCustomer(storefrontSession?.user, storefrontSession?.token) ||
    storefrontSession?.user ||
    null;
  const accountType = user?.accountType || storefrontSession?.user?.accountType;
  const storefrontCustomer = extractStorefrontCustomer(
    user,
    storefrontSession?.token,
  );
  const isRegisteredStoreCustomer =
    Boolean(storefrontCustomer) ||
    hasMatchingRole(isStoreCustomerRole, role, accountType);
  const isGuestSession = false;
  const hasStorefrontCustomerSession = isRegisteredStoreCustomer;
  const sessionStoreId = resolveSessionStoreId(storefrontCustomer || user, storefrontSession);
  const sessionStoreSlug = resolveSessionStoreSlug(
    storefrontCustomer || user,
    storefrontSession,
  );
  const hasRequestedStoreScope = Boolean(
    normalizedScope.storeId || normalizedScope.storeSlug,
  );
  const hasMatchingStoreId =
    Boolean(normalizedScope.storeId) &&
    Boolean(sessionStoreId) &&
    sessionStoreId === normalizedScope.storeId;
  const hasMatchingStoreSlug =
    Boolean(normalizedScope.storeSlug) &&
    Boolean(sessionStoreSlug) &&
    sessionStoreSlug === normalizedScope.storeSlug;
  const hasScopedStorefrontSession =
    storefrontSession.isAuthenticated &&
    hasStorefrontCustomerSession &&
    (hasRequestedStoreScope
      ? hasMatchingStoreId || hasMatchingStoreSlug
      : !sessionStoreId && !sessionStoreSlug);

  return {
    normalizedStoreId: normalizedScope.storeId,
    normalizedStoreSlug: normalizedScope.storeSlug,
    sessionStoreId,
    sessionStoreSlug,
    storefrontSession,
    storefrontCustomer: storefrontCustomer || null,
    isRegisteredStoreCustomer,
    isGuestSession,
    hasStorefrontCustomerSession,
    hasScopedStorefrontSession,
    hasConflictingStoreCustomerSession: false,
    canAutoCreateGuestSession: false,
    useLocalGuestCart: hasRequestedStoreScope && !hasScopedStorefrontSession,
  };
}

export async function ensureStorefrontGuestSession(storeId, storeSlug = "") {
  const normalizedScope = normalizeStoreScope({ storeId, storeSlug });
  return normalizedScope.storeId || normalizedScope.storeSlug
    ? getStorefrontSessionState(
        normalizedScope.storeId,
        normalizedScope.storeSlug,
      )
    : null;
}
