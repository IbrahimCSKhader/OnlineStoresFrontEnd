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

export function migrateLegacyAuthSession() {
  const legacyToken = getStorageItem(storageKeys.legacyAuthToken, "");
  const legacyUser = getStorageJson(storageKeys.legacyAuthUser, null);
  const legacyRole = getStorageItem(storageKeys.legacyAuthRole, "");
  const hasLegacySession = Boolean(legacyToken || legacyUser || legacyRole);

  if (!hasLegacySession) {
    return;
  }

  const scope = inferLegacySessionScope(legacyRole, legacyUser);
  const currentToken = getSessionToken(scope);
  const currentUser = getStoredSessionUser(scope);
  const currentRole = getStoredSessionRole(scope);

  if (!currentToken && legacyToken) {
    setSessionToken(scope, legacyToken);
  }

  if (!currentUser && legacyUser) {
    setStoredSessionUser(scope, legacyUser);
  }

  if (!currentRole && legacyRole) {
    setStoredSessionRole(scope, legacyRole);
  }

  removeStorageItem(storageKeys.legacyAuthToken);
  removeStorageItem(storageKeys.legacyAuthUser);
  removeStorageItem(storageKeys.legacyAuthRole);
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
  clearStoredSession(AUTH_SESSION_SCOPE.STOREFRONT);
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

export function getStorefrontAuthToken() {
  return getSessionToken(AUTH_SESSION_SCOPE.STOREFRONT);
}

export function setStorefrontAuthToken(token) {
  setSessionToken(AUTH_SESSION_SCOPE.STOREFRONT, token);
}

export function clearStorefrontAuthToken() {
  clearSessionToken(AUTH_SESSION_SCOPE.STOREFRONT);
}

export function getStoredStorefrontUser() {
  return getStoredSessionUser(AUTH_SESSION_SCOPE.STOREFRONT);
}

export function setStoredStorefrontUser(user) {
  setStoredSessionUser(AUTH_SESSION_SCOPE.STOREFRONT, user);
}

export function clearStoredStorefrontUser() {
  clearStoredSessionUser(AUTH_SESSION_SCOPE.STOREFRONT);
}

export function getStoredStorefrontRole() {
  return getStoredSessionRole(AUTH_SESSION_SCOPE.STOREFRONT);
}

export function setStoredStorefrontRole(role) {
  setStoredSessionRole(AUTH_SESSION_SCOPE.STOREFRONT, role);
}

export function clearStoredStorefrontRole() {
  clearStoredSessionRole(AUTH_SESSION_SCOPE.STOREFRONT);
}

export function clearStorefrontAuthSession() {
  clearStoredSession(AUTH_SESSION_SCOPE.STOREFRONT);
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
