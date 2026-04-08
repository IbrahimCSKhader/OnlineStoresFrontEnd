import useAuthStore from "../store/authStore.js";
import { getStorageJson, setStorageJson, storageKeys } from "./storage.js";

function normalizeId(value) {
  return value ? String(value) : "";
}

function buildReferenceKey(storeId, storeCustomerId) {
  const normalizedStoreId = normalizeId(storeId);
  const normalizedStoreCustomerId = normalizeId(storeCustomerId);

  if (!normalizedStoreId) {
    return "";
  }

  return `${normalizedStoreId}::${normalizedStoreCustomerId || "anonymous"}`;
}

function getCartReferenceState() {
  return getStorageJson(storageKeys.cartReferences, {});
}

function saveCartReferenceState(state) {
  setStorageJson(storageKeys.cartReferences, state || {});
}

export function getCartReference(storeId, storeCustomerId = "") {
  const key = buildReferenceKey(storeId, storeCustomerId);

  if (!key) {
    return "";
  }

  const state = getCartReferenceState();
  return normalizeId(state[key]);
}

export function setCartReference({ storeId, storeCustomerId = "", cartId }) {
  const key = buildReferenceKey(storeId, storeCustomerId);
  const normalizedCartId = normalizeId(cartId);

  if (!key || !normalizedCartId) {
    return "";
  }

  saveCartReferenceState({
    ...getCartReferenceState(),
    [key]: normalizedCartId,
  });

  return normalizedCartId;
}

export function clearCartReference({ storeId, storeCustomerId = "" }) {
  const key = buildReferenceKey(storeId, storeCustomerId);
  const normalizedStoreId = normalizeId(storeId);

  if (!normalizedStoreId) {
    return;
  }

  const state = { ...getCartReferenceState() };

  if (storeCustomerId) {
    delete state[key];
    saveCartReferenceState(state);
    return;
  }

  Object.keys(state).forEach((currentKey) => {
    if (currentKey.startsWith(`${normalizedStoreId}::`)) {
      delete state[currentKey];
    }
  });

  saveCartReferenceState(state);
}

export function syncCartReference(cartLike, fallback = {}) {
  const entity =
    cartLike?.data && typeof cartLike.data === "object" ? cartLike.data : cartLike;
  const storeId = normalizeId(entity?.storeId || fallback.storeId);
  const storeCustomerId = normalizeId(
    entity?.storeCustomerId || entity?.userId || fallback.storeCustomerId,
  );
  const cartId = normalizeId(entity?.id || entity?.cartId || fallback.cartId);

  if (!storeId || !cartId) {
    return "";
  }

  const authUser = useAuthStore.getState()?.user;

  return setCartReference({
    storeId,
    storeCustomerId: storeCustomerId || normalizeId(authUser?.storeCustomerId),
    cartId,
  });
}

export function resolveCartRequestId({
  storeId,
  storeCustomerId = "",
  cartId = "",
} = {}) {
  const directCartId = normalizeId(cartId);

  if (directCartId) {
    return directCartId;
  }

  const authUser = useAuthStore.getState()?.user;
  const normalizedStoreId = normalizeId(storeId);
  const resolvedStoreCustomerId =
    normalizeId(storeCustomerId) || normalizeId(authUser?.storeCustomerId);
  const storedCartId = getCartReference(normalizedStoreId, resolvedStoreCustomerId);

  if (storedCartId) {
    return storedCartId;
  }

  if (
    normalizedStoreId &&
    normalizeId(authUser?.storeId) === normalizedStoreId &&
    normalizeId(authUser?.cartId)
  ) {
    return normalizeId(authUser.cartId);
  }

  return "";
}
