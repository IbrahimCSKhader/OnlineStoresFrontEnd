import { create } from "zustand";
import { isGuestRole, isStoreCustomerRole } from "../utils/roles.js";
import { extractStorefrontCustomer } from "../utils/authSession.js";
import {
  clearPlatformAuthSession,
  clearStorefrontAuthSession,
  getAllStorefrontAuthSessions,
  getPlatformAuthToken,
  getStoredPlatformRole,
  getStoredPlatformUser,
  migrateLegacyAuthSession,
  normalizeStoreScope,
  normalizeStorefrontAuthSession,
  resolveStorefrontScopeFromUser,
  findStorefrontAuthSessionInCollection,
} from "../utils/token.js";

migrateLegacyAuthSession();

const EMPTY_STOREFRONT_SESSION = normalizeStorefrontAuthSession();

function removeMatchingStorefrontSessions(sessions, scope = {}) {
  const normalizedScope = normalizeStoreScope(scope);

  if (!normalizedScope.storeId && !normalizedScope.storeSlug) {
    return {};
  }

  return Object.values(sessions || {}).reduce((acc, session) => {
    const normalizedSession = normalizeStorefrontAuthSession(session);
    const matchesStoreId =
      Boolean(normalizedScope.storeId) &&
      Boolean(normalizedSession.storeId) &&
      normalizedSession.storeId === normalizedScope.storeId;
    const matchesStoreSlug =
      Boolean(normalizedScope.storeSlug) &&
      Boolean(normalizedSession.storeSlug) &&
      normalizedSession.storeSlug === normalizedScope.storeSlug;

    if (matchesStoreId || matchesStoreSlug) {
      return acc;
    }

    const fallbackKey =
      normalizedSession.storeId || normalizedSession.storeSlug || "";

    if (fallbackKey) {
      acc[fallbackKey] = normalizedSession;
    }

    return acc;
  }, {});
}

function normalizeStorefrontSessionsCollection(sessions = {}) {
  return Object.values(sessions || {}).reduce((acc, session) => {
    const normalizedSession = normalizeStorefrontAuthSession(session);
    const key = normalizedSession.storeId || normalizedSession.storeSlug || "";

    if (key) {
      acc[key] = normalizedSession;
    }

    return acc;
  }, {});
}

function upsertStorefrontSession(sessions, session) {
  const normalizedSession = normalizeStorefrontAuthSession(session);
  const sessionScope = resolveStorefrontScopeFromUser(normalizedSession.user);
  const resolvedScope = normalizeStoreScope({
    storeId: normalizedSession.storeId || sessionScope.storeId,
    storeSlug: normalizedSession.storeSlug || sessionScope.storeSlug,
  });

  if (!resolvedScope.storeId && !resolvedScope.storeSlug) {
    return normalizeStorefrontSessionsCollection(sessions);
  }

  const nextSessions = removeMatchingStorefrontSessions(sessions, resolvedScope);
  const key = resolvedScope.storeId || resolvedScope.storeSlug;

  if (
    !normalizedSession.token &&
    !normalizedSession.user &&
    !normalizedSession.role
  ) {
    return nextSessions;
  }

  nextSessions[key] = normalizeStorefrontAuthSession(
    {
      ...normalizedSession,
      ...resolvedScope,
    },
    resolvedScope,
  );

  return nextSessions;
}

const storedPlatformToken = getPlatformAuthToken();
const storedPlatformUser = getStoredPlatformUser();
const storedPlatformRole = getStoredPlatformRole();
const storedStorefrontSessions = normalizeStorefrontSessionsCollection(
  getAllStorefrontAuthSessions(),
);
const storedPlatformStorefrontCustomer = extractStorefrontCustomer(
  storedPlatformUser,
  storedPlatformToken,
);
const hasStoredStorefrontCustomerSession = Object.values(
  storedStorefrontSessions,
).some((session) => Boolean(extractStorefrontCustomer(session?.user)));
const shouldDiscardStorefrontScopedPlatformSession =
  Boolean(storedPlatformStorefrontCustomer) ||
  isStoreCustomerRole(storedPlatformRole) ||
  isStoreCustomerRole(storedPlatformUser?.accountType);
const shouldDiscardGuestStorefrontSessions =
  !hasStoredStorefrontCustomerSession &&
  Object.values(storedStorefrontSessions).some(
    (session) =>
      isGuestRole(session?.role) || isGuestRole(session?.user?.accountType),
  );

if (shouldDiscardStorefrontScopedPlatformSession) {
  clearPlatformAuthSession();
}

if (shouldDiscardGuestStorefrontSessions) {
  clearStorefrontAuthSession();
}

const initialPlatformSession = {
  token: shouldDiscardStorefrontScopedPlatformSession ? "" : storedPlatformToken,
  user: shouldDiscardStorefrontScopedPlatformSession ? null : storedPlatformUser,
  role: shouldDiscardStorefrontScopedPlatformSession ? "" : storedPlatformRole,
  isAuthenticated: Boolean(
    shouldDiscardStorefrontScopedPlatformSession ? "" : storedPlatformToken,
  ),
};

const initialState = {
  platformSession: initialPlatformSession,
  storefrontSessions: shouldDiscardGuestStorefrontSessions
    ? {}
    : storedStorefrontSessions,
  storefrontSession: EMPTY_STOREFRONT_SESSION,
};

const useAuthStore = create((set) => ({
  ...initialState,
  setPlatformSession: ({ token, user, role }) =>
    set({
      platformSession: {
        token: token ?? "",
        user: user ?? null,
        role: role ?? "",
        isAuthenticated: Boolean(token),
      },
    }),
  clearPlatformSession: () =>
    set({
      platformSession: {
        token: "",
        user: null,
        role: "",
        isAuthenticated: false,
      },
    }),
  setStorefrontSession: ({ token, user, role, storeId, storeSlug }) =>
    set((state) => {
      const nextSession = normalizeStorefrontAuthSession({
        token,
        user,
        role,
        storeId,
        storeSlug,
      });

      return {
        storefrontSessions: upsertStorefrontSession(
          state.storefrontSessions,
          nextSession,
        ),
        storefrontSession: nextSession,
      };
    }),
  selectStorefrontSession: (scope = {}) =>
    set((state) => {
      const normalizedScope = normalizeStoreScope(scope);
      const matchedSession =
        findStorefrontAuthSessionInCollection(
          state.storefrontSessions,
          normalizedScope,
        )?.[1] || null;

      return {
        storefrontSession: matchedSession
          ? normalizeStorefrontAuthSession(matchedSession, normalizedScope)
          : EMPTY_STOREFRONT_SESSION,
      };
    }),
  clearStorefrontSession: (scope = {}) =>
    set((state) => {
      const fallbackScope = normalizeStoreScope(state.storefrontSession);
      const normalizedScope = normalizeStoreScope(
        scope?.storeId || scope?.storeSlug ? scope : fallbackScope,
      );

      if (!normalizedScope.storeId && !normalizedScope.storeSlug) {
        return {
          storefrontSession: EMPTY_STOREFRONT_SESSION,
        };
      }

      const nextStorefrontSession = normalizeStorefrontAuthSession(
        state.storefrontSession,
      );
      const matchesCurrentStoreId =
        Boolean(normalizedScope.storeId) &&
        nextStorefrontSession.storeId === normalizedScope.storeId;
      const matchesCurrentStoreSlug =
        Boolean(normalizedScope.storeSlug) &&
        nextStorefrontSession.storeSlug === normalizedScope.storeSlug;

      return {
        storefrontSessions: removeMatchingStorefrontSessions(
          state.storefrontSessions,
          normalizedScope,
        ),
        storefrontSession:
          matchesCurrentStoreId || matchesCurrentStoreSlug
            ? EMPTY_STOREFRONT_SESSION
            : nextStorefrontSession,
      };
    }),
  syncStorefrontSessions: (sessions = {}) =>
    set((state) => {
      const nextSessions = normalizeStorefrontSessionsCollection(sessions);
      const activeSessionScope = normalizeStoreScope(state.storefrontSession);
      const activeMatchedSession =
        findStorefrontAuthSessionInCollection(nextSessions, activeSessionScope)?.[1] ||
        null;

      return {
        storefrontSessions: nextSessions,
        storefrontSession: activeMatchedSession
          ? normalizeStorefrontAuthSession(activeMatchedSession, activeSessionScope)
          : EMPTY_STOREFRONT_SESSION,
      };
    }),
  clearAllSessions: () =>
    set({
      platformSession: {
        token: "",
        user: null,
        role: "",
        isAuthenticated: false,
      },
      storefrontSessions: {},
      storefrontSession: EMPTY_STOREFRONT_SESSION,
    }),
}));

export default useAuthStore;
