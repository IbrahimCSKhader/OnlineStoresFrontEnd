import {
  getStorageItem,
  getStorageJson,
  removeStorageItem,
  setStorageItem,
  setStorageJson,
  storageKeys,
} from "./storage.js";

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

export function getAuthToken() {
  return getStorageItem(storageKeys.authToken, "");
}

export function setAuthToken(token) {
  if (!token) {
    removeStorageItem(storageKeys.authToken);
    return;
  }

  setStorageItem(storageKeys.authToken, token);
}

export function clearAuthToken() {
  removeStorageItem(storageKeys.authToken);
}

export function getStoredAuthUser() {
  return getStorageJson(storageKeys.authUser, null);
}

export function setStoredAuthUser(user) {
  if (!user) {
    removeStorageItem(storageKeys.authUser);
    return;
  }

  setStorageJson(storageKeys.authUser, user);
}

export function clearStoredAuthUser() {
  removeStorageItem(storageKeys.authUser);
}

export function getStoredAuthRole() {
  return getStorageItem(storageKeys.authRole, "");
}

export function setStoredAuthRole(role) {
  const normalizedRole = serializeRole(role);

  if (!normalizedRole) {
    removeStorageItem(storageKeys.authRole);
    return;
  }

  setStorageItem(storageKeys.authRole, normalizedRole);
}

export function clearStoredAuthRole() {
  removeStorageItem(storageKeys.authRole);
}

export function clearAuthSession() {
  clearAuthToken();
  clearStoredAuthUser();
  clearStoredAuthRole();
}
