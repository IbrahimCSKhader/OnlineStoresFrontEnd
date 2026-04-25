import {
  getStorageItem,
  getStorageJson,
  removeStorageItem,
  setStorageItem,
  setStorageJson,
  storageKeys,
} from "./storage.js";
import { isGuestRole, isStoreCustomerRole } from "./roles.js";

export const AUTH_SESSION_SCOPE = {
  PLATFORM: "platform",
  STOREFRONT: "storefront",
};

function logAuthToken(action, scope, token = "") {
  console.log("[AuthToken]", {
    action,
    scope,
    token: token || "",
  });
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeStoreSlug(value) {
  return normalizeValue(value).toLowerCase();
}

function serializeRole(role) {
  if (Array.isArray(role)) {
    return role.find(Boolean) ?? "";
  }

  if (role && typeof role === "object") {
    return (
      role.name ||
      role.value ||
      role.role ||
      role.code ||
      role.displayName ||
      role.title ||
      ""
    );
  }

  return role ? String(role) : "";
}

function resolveSessionScope(scope) {
  return scope === AUTH_SESSION_SCOPE.STOREFRONT
    ? AUTH_SESSION_SCOPE.STOREFRONT
    : AUTH_SESSION_SCOPE.PLATFORM;
}

function getTokenStorageKey(scope) {
  return resolveSessionScope(scope) === AUTH_SESSION_SCOPE.STOREFRONT
    ? storageKeys.storefrontAuthToken
    : storageKeys.platformAuthToken;
}

function getUserStorageKey(scope) {
  return resolveSessionScope(scope) === AUTH_SESSION_SCOPE.STOREFRONT
    ? storageKeys.storefrontAuthUser
    : storageKeys.platformAuthUser;
}

function getRoleStorageKey(scope) {
  return resolveSessionScope(scope) === AUTH_SESSION_SCOPE.STOREFRONT
    ? storageKeys.storefrontAuthRole
    : storageKeys.platformAuthRole;
}

function inferLegacySessionScope(role, user) {
  if (
    isStoreCustomerRole(role) ||
    isStoreCustomerRole(user?.accountType) ||
    isGuestRole(role) ||
    isGuestRole(user?.accountType)
  ) {
    return AUTH_SESSION_SCOPE.STOREFRONT;
  }

  return AUTH_SESSION_SCOPE.PLATFORM;
}

export function normalizeStoreScope(scope = {}, storeSlug = "") {
  if (
    typeof scope === "string" ||
    typeof scope === "number" ||
    typeof scope === "boolean"
  ) {
    return {
      storeId: normalizeValue(scope),
      storeSlug: normalizeStoreSlug(storeSlug),
    };
  }

  return {
    storeId: normalizeValue(scope?.storeId || scope?.StoreId),
    storeSlug: normalizeStoreSlug(scope?.storeSlug || scope?.StoreSlug),
  };
}

export function resolveStorefrontScopeFromUser(user) {
  return normalizeStoreScope({
    storeId: user?.storeId || user?.StoreId || user?.store?.id,
    storeSlug: user?.storeSlug || user?.StoreSlug || user?.store?.slug,
  });
}

export function buildStorefrontSessionKey(scope = {}, storeSlug = "") {
  const normalizedScope = normalizeStoreScope(scope, storeSlug);

  if (normalizedScope.storeId) {
    return `store:${normalizedScope.storeId}`;
  }

  if (normalizedScope.storeSlug) {
    return `slug:${normalizedScope.storeSlug}`;
  }

  return "";
}

export function normalizeStorefrontAuthSession(session = {}, fallbackScope = {}) {
  const normalizedFallbackScope = normalizeStoreScope(fallbackScope);
  const user = session?.user ?? null;
  const userScope = resolveStorefrontScopeFromUser(user);
  const storeId = normalizeValue(
    session?.storeId || normalizedFallbackScope.storeId || userScope.storeId,
  );
  const storeSlug = normalizeStoreSlug(
    session?.storeSlug || normalizedFallbackScope.storeSlug || userScope.storeSlug,
  );
  const token = normalizeValue(session?.token);
  const role = serializeRole(session?.role);

  return {
    token,
    user,
    role,
    storeId,
    storeSlug,
    isAuthenticated: Boolean(token),
  };
}

export function doesStorefrontSessionMatchScope(
  session = {},
  scope = {},
  storeSlug = "",
) {
  const normalizedScope = normalizeStoreScope(scope, storeSlug);
  const normalizedSession = normalizeStorefrontAuthSession(session);

  if (!normalizedScope.storeId && !normalizedScope.storeSlug) {
    return false;
  }

  return (
    (Boolean(normalizedScope.storeId) &&
      Boolean(normalizedSession.storeId) &&
      normalizedSession.storeId === normalizedScope.storeId) ||
    (Boolean(normalizedScope.storeSlug) &&
      Boolean(normalizedSession.storeSlug) &&
      normalizedSession.storeSlug === normalizedScope.storeSlug)
  );
}

function normalizeStorefrontAuthSessionsMap(sessions = {}) {
  if (!sessions || typeof sessions !== "object") {
    return {};
  }

  const normalizedEntries = Object.values(sessions).reduce((acc, session) => {
    const normalizedSession = normalizeStorefrontAuthSession(session);
    const key = buildStorefrontSessionKey(normalizedSession);

    if (
      !key ||
      (!normalizedSession.token &&
        !normalizedSession.user &&
        !normalizedSession.role)
    ) {
      return acc;
    }

    acc[key] = normalizedSession;
    return acc;
  }, {});

  return normalizedEntries;
}

export function findStorefrontAuthSessionInCollection(
  sessions = {},
  scope = {},
  storeSlug = "",
) {
  const normalizedSessions = normalizeStorefrontAuthSessionsMap(sessions);
  const normalizedScope = normalizeStoreScope(scope, storeSlug);
  const exactKey = buildStorefrontSessionKey(normalizedScope);

  if (exactKey && normalizedSessions[exactKey]) {
    return [exactKey, normalizedSessions[exactKey]];
  }

  return (
    Object.entries(normalizedSessions).find(([, session]) =>
      doesStorefrontSessionMatchScope(session, normalizedScope),
    ) || null
  );
}

export function getAllStorefrontAuthSessions() {
  return normalizeStorefrontAuthSessionsMap(
    getStorageJson(storageKeys.storefrontAuthSessions, {}),
  );
}

export function setAllStorefrontAuthSessions(sessions = {}) {
  const normalizedSessions = normalizeStorefrontAuthSessionsMap(sessions);

  if (!Object.keys(normalizedSessions).length) {
    removeStorageItem(storageKeys.storefrontAuthSessions);
    return;
  }

  setStorageJson(storageKeys.storefrontAuthSessions, normalizedSessions);
}

function clearLegacyStorefrontSessionFields() {
  removeStorageItem(storageKeys.storefrontAuthToken);
  removeStorageItem(storageKeys.storefrontAuthUser);
  removeStorageItem(storageKeys.storefrontAuthRole);
}

export function getStorefrontAuthSession(scope = {}, storeSlug = "") {
  return (
    findStorefrontAuthSessionInCollection(
      getAllStorefrontAuthSessions(),
      scope,
      storeSlug,
    )?.[1] || null
  );
}

export function setStorefrontAuthSession(scope = {}, session = {}) {
  const normalizedSession = normalizeStorefrontAuthSession(session, scope);
  const key = buildStorefrontSessionKey(normalizedSession);
  const nextSessions = {
    ...getAllStorefrontAuthSessions(),
  };

  Object.entries(nextSessions).forEach(([existingKey, existingSession]) => {
    if (
      doesStorefrontSessionMatchScope(existingSession, normalizedSession) ||
      existingKey === key
    ) {
      delete nextSessions[existingKey];
    }
  });

  if (
    key &&
    (normalizedSession.token || normalizedSession.user || normalizedSession.role)
  ) {
    nextSessions[key] = normalizedSession;
  }

  setAllStorefrontAuthSessions(nextSessions);
  clearLegacyStorefrontSessionFields();

  return normalizedSession;
}

export function clearStorefrontAuthSession(scope = {}, storeSlug = "") {
  const normalizedScope = normalizeStoreScope(scope, storeSlug);

  if (!normalizedScope.storeId && !normalizedScope.storeSlug) {
    removeStorageItem(storageKeys.storefrontAuthSessions);
    clearLegacyStorefrontSessionFields();
    return;
  }

  const nextSessions = {
    ...getAllStorefrontAuthSessions(),
  };

  Object.entries(nextSessions).forEach(([key, session]) => {
    if (
      key === buildStorefrontSessionKey(normalizedScope) ||
      doesStorefrontSessionMatchScope(session, normalizedScope)
    ) {
      delete nextSessions[key];
    }
  });

  setAllStorefrontAuthSessions(nextSessions);
  clearLegacyStorefrontSessionFields();
}

export function migrateLegacyAuthSession() {
  const legacyToken = getStorageItem(storageKeys.legacyAuthToken, "");
  const legacyUser = getStorageJson(storageKeys.legacyAuthUser, null);
  const legacyRole = getStorageItem(storageKeys.legacyAuthRole, "");
  const hasLegacySession = Boolean(legacyToken || legacyUser || legacyRole);

  if (hasLegacySession) {
    const scope = inferLegacySessionScope(legacyRole, legacyUser);
    const currentToken = getSessionToken(scope);
    const currentUser = getStoredSessionUser(scope);
    const currentRole = getStoredSessionRole(scope);

    if (scope === AUTH_SESSION_SCOPE.STOREFRONT) {
      const legacyStoreScope = resolveStorefrontScopeFromUser(legacyUser);
      const hasExistingScopedSessions =
        Object.keys(getAllStorefrontAuthSessions()).length > 0;

      if (
        !hasExistingScopedSessions &&
        (legacyStoreScope.storeId || legacyStoreScope.storeSlug)
      ) {
        setStorefrontAuthSession(legacyStoreScope, {
          token: legacyToken,
          user: legacyUser,
          role: legacyRole,
        });
      }
    } else {
      if (!currentToken && legacyToken) {
        setSessionToken(scope, legacyToken);
      }

      if (!currentUser && legacyUser) {
        setStoredSessionUser(scope, legacyUser);
      }

      if (!currentRole && legacyRole) {
        setStoredSessionRole(scope, legacyRole);
      }
    }

    removeStorageItem(storageKeys.legacyAuthToken);
    removeStorageItem(storageKeys.legacyAuthUser);
    removeStorageItem(storageKeys.legacyAuthRole);
  }

  const legacyStorefrontToken = getStorageItem(storageKeys.storefrontAuthToken, "");
  const legacyStorefrontUser = getStorageJson(storageKeys.storefrontAuthUser, null);
  const legacyStorefrontRole = getStorageItem(storageKeys.storefrontAuthRole, "");
  const hasLegacyStorefrontSession = Boolean(
    legacyStorefrontToken || legacyStorefrontUser || legacyStorefrontRole,
  );
  const hasScopedStorefrontSessions =
    Object.keys(getAllStorefrontAuthSessions()).length > 0;

  if (!hasScopedStorefrontSessions && hasLegacyStorefrontSession) {
    const legacyScope = resolveStorefrontScopeFromUser(legacyStorefrontUser);

    if (legacyScope.storeId || legacyScope.storeSlug) {
      setStorefrontAuthSession(legacyScope, {
        token: legacyStorefrontToken,
        user: legacyStorefrontUser,
        role: legacyStorefrontRole,
      });
    }
  }

  clearLegacyStorefrontSessionFields();
}

export function getSessionToken(scope) {
  const resolvedScope = resolveSessionScope(scope);
  const token = getStorageItem(getTokenStorageKey(resolvedScope), "");
  logAuthToken("read", resolvedScope, token);
  return token;
}

export function setSessionToken(scope, token) {
  const resolvedScope = resolveSessionScope(scope);

  if (!token) {
    logAuthToken("set-empty", resolvedScope, "");
    removeStorageItem(getTokenStorageKey(resolvedScope));
    return;
  }

  logAuthToken("set", resolvedScope, token);
  setStorageItem(getTokenStorageKey(resolvedScope), token);
}

export function clearSessionToken(scope) {
  const resolvedScope = resolveSessionScope(scope);
  logAuthToken("clear", resolvedScope, "");
  removeStorageItem(getTokenStorageKey(resolvedScope));
}

export function getStoredSessionUser(scope) {
  return getStorageJson(getUserStorageKey(scope), null);
}

export function setStoredSessionUser(scope, user) {
  if (!user) {
    removeStorageItem(getUserStorageKey(scope));
    return;
  }

  setStorageJson(getUserStorageKey(scope), user);
}

export function clearStoredSessionUser(scope) {
  removeStorageItem(getUserStorageKey(scope));
}

export function getStoredSessionRole(scope) {
  return getStorageItem(getRoleStorageKey(scope), "");
}

export function setStoredSessionRole(scope, role) {
  const normalizedRole = serializeRole(role);

  if (!normalizedRole) {
    removeStorageItem(getRoleStorageKey(scope));
    return;
  }

  setStorageItem(getRoleStorageKey(scope), normalizedRole);
}

export function clearStoredSessionRole(scope) {
  removeStorageItem(getRoleStorageKey(scope));
}

export function getStoredSession(scope) {
  const resolvedScope = resolveSessionScope(scope);

  return {
    token: getSessionToken(resolvedScope),
    user: getStoredSessionUser(resolvedScope),
    role: getStoredSessionRole(resolvedScope),
  };
}

export function setStoredSession(scope, { token, user, role } = {}) {
  const resolvedScope = resolveSessionScope(scope);

  setSessionToken(resolvedScope, token);
  setStoredSessionUser(resolvedScope, user);
  setStoredSessionRole(resolvedScope, role);
}

export function clearStoredSession(scope) {
  const resolvedScope = resolveSessionScope(scope);

  clearSessionToken(resolvedScope);
  clearStoredSessionUser(resolvedScope);
  clearStoredSessionRole(resolvedScope);
}

export function clearAllAuthSessions() {
  clearStoredSession(AUTH_SESSION_SCOPE.PLATFORM);
  clearStorefrontAuthSession();
}

export function getPlatformAuthToken() {
  return getSessionToken(AUTH_SESSION_SCOPE.PLATFORM);
}

export function setPlatformAuthToken(token) {
  setSessionToken(AUTH_SESSION_SCOPE.PLATFORM, token);
}

export function clearPlatformAuthToken() {
  clearSessionToken(AUTH_SESSION_SCOPE.PLATFORM);
}

export function getStoredPlatformUser() {
  return getStoredSessionUser(AUTH_SESSION_SCOPE.PLATFORM);
}

export function setStoredPlatformUser(user) {
  setStoredSessionUser(AUTH_SESSION_SCOPE.PLATFORM, user);
}

export function clearStoredPlatformUser() {
  clearStoredSessionUser(AUTH_SESSION_SCOPE.PLATFORM);
}

export function getStoredPlatformRole() {
  return getStoredSessionRole(AUTH_SESSION_SCOPE.PLATFORM);
}

export function setStoredPlatformRole(role) {
  setStoredSessionRole(AUTH_SESSION_SCOPE.PLATFORM, role);
}

export function clearStoredPlatformRole() {
  clearStoredSessionRole(AUTH_SESSION_SCOPE.PLATFORM);
}

export function clearPlatformAuthSession() {
  clearStoredSession(AUTH_SESSION_SCOPE.PLATFORM);
}

export function getStorefrontAuthToken(scope = {}, storeSlug = "") {
  return getStorefrontAuthSession(scope, storeSlug)?.token || "";
}

export function setStorefrontAuthToken(token, scope = {}, storeSlug = "") {
  const normalizedScope = normalizeStoreScope(scope, storeSlug);
  const currentSession = getStorefrontAuthSession(normalizedScope) || {};

  setStorefrontAuthSession(normalizedScope, {
    ...currentSession,
    token,
  });
}

export function clearStorefrontAuthToken(scope = {}, storeSlug = "") {
  const normalizedScope = normalizeStoreScope(scope, storeSlug);

  if (!normalizedScope.storeId && !normalizedScope.storeSlug) {
    clearStorefrontAuthSession();
    return;
  }

  const currentSession = getStorefrontAuthSession(normalizedScope);

  setStorefrontAuthSession(normalizedScope, {
    ...currentSession,
    token: "",
  });
}

export function getStoredStorefrontUser(scope = {}, storeSlug = "") {
  return getStorefrontAuthSession(scope, storeSlug)?.user || null;
}

export function setStoredStorefrontUser(user, scope = {}, storeSlug = "") {
  const normalizedScope = normalizeStoreScope(scope, storeSlug);
  const resolvedScope =
    normalizedScope.storeId || normalizedScope.storeSlug
      ? normalizedScope
      : resolveStorefrontScopeFromUser(user);

  if (!resolvedScope.storeId && !resolvedScope.storeSlug) {
    return;
  }

  const currentSession = getStorefrontAuthSession(resolvedScope) || {};

  setStorefrontAuthSession(resolvedScope, {
    ...currentSession,
    user,
  });
}

export function clearStoredStorefrontUser(scope = {}, storeSlug = "") {
  const normalizedScope = normalizeStoreScope(scope, storeSlug);

  if (!normalizedScope.storeId && !normalizedScope.storeSlug) {
    clearStorefrontAuthSession();
    return;
  }

  const currentSession = getStorefrontAuthSession(normalizedScope);

  setStorefrontAuthSession(normalizedScope, {
    ...currentSession,
    user: null,
  });
}

export function getStoredStorefrontRole(scope = {}, storeSlug = "") {
  return getStorefrontAuthSession(scope, storeSlug)?.role || "";
}

export function setStoredStorefrontRole(role, scope = {}, storeSlug = "") {
  const normalizedScope = normalizeStoreScope(scope, storeSlug);

  if (!normalizedScope.storeId && !normalizedScope.storeSlug) {
    return;
  }

  const currentSession = getStorefrontAuthSession(normalizedScope) || {};

  setStorefrontAuthSession(normalizedScope, {
    ...currentSession,
    role,
  });
}

export function clearStoredStorefrontRole(scope = {}, storeSlug = "") {
  const normalizedScope = normalizeStoreScope(scope, storeSlug);

  if (!normalizedScope.storeId && !normalizedScope.storeSlug) {
    clearStorefrontAuthSession();
    return;
  }

  const currentSession = getStorefrontAuthSession(normalizedScope);

  setStorefrontAuthSession(normalizedScope, {
    ...currentSession,
    role: "",
  });
}

export const getAuthToken = getPlatformAuthToken;
export const setAuthToken = setPlatformAuthToken;
export const clearAuthToken = clearPlatformAuthToken;
export const getStoredAuthUser = getStoredPlatformUser;
export const setStoredAuthUser = setStoredPlatformUser;
export const clearStoredAuthUser = clearStoredPlatformUser;
export const getStoredAuthRole = getStoredPlatformRole;
export const setStoredAuthRole = setStoredPlatformRole;
export const clearStoredAuthRole = clearStoredPlatformRole;
export const clearAuthSession = clearPlatformAuthSession;
