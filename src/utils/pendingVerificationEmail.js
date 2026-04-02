import { getStorageItem, removeStorageItem, setStorageItem } from "./storage.js";

const pendingVerificationEmailKey = "online-store.pending-verification-email";

export function getPendingVerificationEmail() {
  return getStorageItem(pendingVerificationEmailKey, "");
}

export function setPendingVerificationEmail(email) {
  const normalizedEmail = (email || "").trim();

  if (!normalizedEmail) {
    removeStorageItem(pendingVerificationEmailKey);
    return;
  }

  setStorageItem(pendingVerificationEmailKey, normalizedEmail);
}

export function clearPendingVerificationEmail() {
  removeStorageItem(pendingVerificationEmailKey);
}
