import cartApi from "../API/cart.api.js";
import storeCustomerAuthApi from "../API/storeCustomerAuth.api.js";
import useAuthStore from "../store/authStore.js";
import { extractRole, extractToken, extractUser } from "./authSession.js";
import { clearGuestCart, getGuestCart } from "./guestCart.js";
import {
  isGuestRole,
  isOwnerRole,
  isStoreCustomerRole,
  isSuperAdminRole,
} from "./roles.js";
import { setAuthToken, setStoredAuthRole, setStoredAuthUser } from "./token.js";

const pendingGuestSessionRequests = new Map();

function normalizeStoreId(storeId) {
  return storeId ? String(storeId) : "";
}

function hasMatchingRole(checkRole, role, accountType) {
  return checkRole(role) || checkRole(accountType);
}

function resolveSessionStoreId(user) {
  return normalizeStoreId(user?.storeId || user?.StoreId || user?.store?.id);
}

function persistAuthSession(data) {
  const token = extractToken(data);
  const user = extractUser(data, token);
  const role = extractRole(data, token, user);

  if (token) {
    setAuthToken(token);
  }

  if (user) {
    setStoredAuthUser(user);
  }

  if (role) {
    setStoredAuthRole(role);
  }

  if (token || user || role) {
    useAuthStore.getState().setSession({ token, user, role });
  }

  return {
    token,
    user,
    role,
  };
}

async function migrateGuestCartToServer(storeId) {
  const guestCart = getGuestCart(storeId);

  if (!Array.isArray(guestCart?.items) || !guestCart.items.length) {
    return null;
  }

  let lastServerCart = null;

  for (const item of guestCart.items) {
    lastServerCart = await cartApi.addToCart({
      productId: item.productId,
      quantity: item.quantity,
      storeId,
      variantId: item.variantId || null,
    });
  }

  clearGuestCart(storeId);
  return lastServerCart;
}

export function getStorefrontSessionState(storeId, authState = useAuthStore.getState()) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const role = authState?.role;
  const user = authState?.user;
  const accountType = user?.accountType;
  const isRegisteredStoreCustomer = hasMatchingRole(
    isStoreCustomerRole,
    role,
    accountType,
  );
  const isGuestSession = hasMatchingRole(isGuestRole, role, accountType);
  const hasStorefrontCustomerSession = isRegisteredStoreCustomer || isGuestSession;
  const isPlatformUser =
    hasMatchingRole(isOwnerRole, role, accountType) ||
    hasMatchingRole(isSuperAdminRole, role, accountType);
  const sessionStoreId = resolveSessionStoreId(user);
  const hasScopedStorefrontSession =
    hasStorefrontCustomerSession &&
    (!normalizedStoreId || !sessionStoreId || sessionStoreId === normalizedStoreId);
  const hasConflictingStoreCustomerSession =
    isRegisteredStoreCustomer &&
    Boolean(normalizedStoreId) &&
    Boolean(sessionStoreId) &&
    sessionStoreId !== normalizedStoreId;
  const canAutoCreateGuestSession =
    Boolean(normalizedStoreId) &&
    !isPlatformUser &&
    (!authState?.isAuthenticated || (isGuestSession && !hasScopedStorefrontSession));

  return {
    normalizedStoreId,
    sessionStoreId,
    isRegisteredStoreCustomer,
    isGuestSession,
    hasStorefrontCustomerSession,
    hasScopedStorefrontSession,
    hasConflictingStoreCustomerSession,
    canAutoCreateGuestSession,
    useLocalGuestCart:
      Boolean(normalizedStoreId) &&
      !hasScopedStorefrontSession &&
      !canAutoCreateGuestSession,
  };
}

export async function ensureStorefrontGuestSession(storeId) {
  const normalizedStoreId = normalizeStoreId(storeId);

  if (!normalizedStoreId) {
    return null;
  }

  const sessionState = getStorefrontSessionState(normalizedStoreId);

  if (
    sessionState.hasScopedStorefrontSession ||
    sessionState.useLocalGuestCart ||
    !sessionState.canAutoCreateGuestSession
  ) {
    return sessionState;
  }

  if (pendingGuestSessionRequests.has(normalizedStoreId)) {
    return pendingGuestSessionRequests.get(normalizedStoreId);
  }

  const request = (async () => {
    const data = await storeCustomerAuthApi.guest({ storeId: normalizedStoreId });
    const session = persistAuthSession(data);
    const cart = await migrateGuestCartToServer(normalizedStoreId);

    return {
      ...getStorefrontSessionState(normalizedStoreId),
      session,
      cart,
    };
  })().finally(() => {
    pendingGuestSessionRequests.delete(normalizedStoreId);
  });

  pendingGuestSessionRequests.set(normalizedStoreId, request);
  return request;
}
