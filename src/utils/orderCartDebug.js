import { normalizeEntityResponse, normalizeListResponse } from "./collections.js";
import { normalizeCartResponse } from "./storefront.js";

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") || "";
}

function asString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function toNumber(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

export function buildStorefrontSessionSummary(sessionState = {}) {
  const storefrontCustomer = sessionState?.storefrontCustomer || {};

  return {
    normalizedStoreId: asString(sessionState?.normalizedStoreId),
    sessionStoreId: asString(sessionState?.sessionStoreId),
    storefrontCustomerId: asString(
      firstDefined(storefrontCustomer?.id, storefrontCustomer?.storeCustomerId),
    ),
    hasScopedStorefrontSession: Boolean(sessionState?.hasScopedStorefrontSession),
    hasConflictingStoreCustomerSession: Boolean(
      sessionState?.hasConflictingStoreCustomerSession,
    ),
    isRegisteredStoreCustomer: Boolean(sessionState?.isRegisteredStoreCustomer),
    isGuestSession: Boolean(sessionState?.isGuestSession),
    useLocalGuestCart: Boolean(sessionState?.useLocalGuestCart),
    canAutoCreateGuestSession: Boolean(sessionState?.canAutoCreateGuestSession),
  };
}

export function buildOrderCartActor({ auth = {}, storefrontSession = {}, storeId, slug } = {}) {
  const storefrontCustomer =
    auth?.storefrontCustomer || storefrontSession?.storefrontCustomer || null;
  const storeCustomer = auth?.storeCustomer || storefrontCustomer || null;
  const customerId = firstDefined(
    storeCustomer?.id,
    storeCustomer?.storeCustomerId,
    storefrontCustomer?.id,
    storefrontCustomer?.storeCustomerId,
    auth?.user?.storeCustomerId,
    auth?.user?.customerStoreId,
    auth?.user?.id,
  );
  const storeCustomerId = firstDefined(
    storeCustomer?.storeCustomerId,
    storefrontCustomer?.storeCustomerId,
    auth?.user?.storeCustomerId,
    auth?.user?.customerStoreId,
    customerId,
  );

  return {
    slug: asString(slug),
    activeStoreId: asString(
      firstDefined(storeId, storefrontSession?.normalizedStoreId, storefrontSession?.sessionStoreId),
    ),
    sessionStoreId: asString(storefrontSession?.sessionStoreId),
    customerId: asString(customerId),
    storeCustomerId: asString(storeCustomerId),
    authRole: asString(auth?.role),
    isAuthenticated: Boolean(auth?.isAuthenticated),
    hasStorefrontCustomerSession: Boolean(auth?.hasStorefrontCustomerSession),
    hasScopedStorefrontSession: Boolean(storefrontSession?.hasScopedStorefrontSession),
    sessionMode: storefrontSession?.useLocalGuestCart
      ? "local-guest-cart"
      : storefrontSession?.isGuestSession
        ? "guest-session"
        : storefrontSession?.isRegisteredStoreCustomer
          ? "registered-store-customer"
          : auth?.isAuthenticated
            ? "authenticated-non-storefront"
            : "anonymous",
  };
}

export function getCartDebugSummary(data, match = {}) {
  const cart = normalizeCartResponse(data);
  const targetCartItemId = asString(match?.cartItemId);
  const targetProductId = asString(match?.productId);
  const targetVariantId = asString(match?.variantId);
  let matchedItem = null;

  if (targetCartItemId) {
    matchedItem =
      cart.items.find((item) => asString(item.id) === targetCartItemId) || null;
  }

  if (!matchedItem && targetProductId) {
    matchedItem =
      cart.items.find((item) => {
        if (asString(item.productId) !== targetProductId) {
          return false;
        }

        if (!targetVariantId) {
          return true;
        }

        return asString(item.variantId) === targetVariantId;
      }) || null;
  }

  return {
    cartId: asString(cart.id),
    cartStoreId: asString(cart.storeId),
    cartCustomerId: asString(
      firstDefined(cart.storeCustomerId, cart.customerStoreId, cart.userId),
    ),
    cartItemCount: toNumber(cart.itemCount),
    cartItemsLength: Array.isArray(cart.items) ? cart.items.length : 0,
    cartItemIds: cart.items.map((item) => asString(item.id)),
    cartSubtotal: toNumber(cart.subtotal),
    cartDiscount: toNumber(cart.discount),
    cartTotalAmount: toNumber(cart.totalAmount),
    matchedCartItemId: asString(matchedItem?.id || targetCartItemId),
    matchedProductId: asString(matchedItem?.productId || targetProductId),
    matchedVariantId: asString(matchedItem?.variantId || targetVariantId),
    matchedQuantity: toNumber(matchedItem?.quantity),
    matchedUnitPrice: toNumber(matchedItem?.unitPrice),
    matchedTotalPrice: toNumber(matchedItem?.totalPrice),
    cartItems: cart.items.map((item) => ({
      cartItemId: asString(item.id),
      productId: asString(item.productId),
      variantId: asString(item.variantId),
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      totalPrice: toNumber(item.totalPrice),
    })),
  };
}

export function getOrderDebugSummary(data) {
  const entity = normalizeEntityResponse(data) ?? data ?? {};
  const items = normalizeListResponse(
    entity?.items ||
      entity?.orderItems ||
      entity?.details ||
      entity?.orderDetails ||
      entity?.products,
  );

  return {
    orderId: asString(firstDefined(entity?.id, entity?.orderId)),
    orderNumber: asString(
      firstDefined(entity?.orderNumber, entity?.number, entity?.code),
    ),
    orderStoreId: asString(firstDefined(entity?.storeId, entity?.StoreId)),
    orderCustomerId: asString(
      firstDefined(
        entity?.storeCustomerId,
        entity?.customerStoreId,
        entity?.CustomerStoreId,
        entity?.userId,
      ),
    ),
    orderStatus: asString(
      firstDefined(entity?.status, entity?.orderStatus, entity?.OrderStatus),
    ),
    orderItemsLength: items.length,
    orderItemIds: items.map((item) =>
      asString(firstDefined(item?.id, item?.orderItemId, item?.productId, item?.cartItemId)),
    ),
    orderTotalAmount: toNumber(
      firstDefined(
        entity?.finalTotal,
        entity?.grandTotal,
        entity?.totalAmount,
        entity?.total,
      ),
    ),
    orderItems: items.map((item) => ({
      orderItemId: asString(firstDefined(item?.id, item?.orderItemId)),
      cartItemId: asString(item?.cartItemId),
      productId: asString(firstDefined(item?.productId, item?.product?.id)),
      quantity: toNumber(item?.quantity),
      unitPrice: toNumber(
        firstDefined(item?.unitPrice, item?.price, item?.productPrice),
      ),
      totalPrice: toNumber(
        firstDefined(item?.totalPrice, item?.lineTotal, item?.subtotal),
      ),
    })),
  };
}

export function normalizeCartItemMutationInput(input) {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return {
      cartItemId: asString(input.cartItemId),
      payload: input.payload && typeof input.payload === "object" ? input.payload : {},
      debugSource: asString(input.debugSource),
    };
  }

  return {
    cartItemId: asString(input),
    payload: {},
    debugSource: "",
  };
}

export function normalizeClearCartMutationInput(input) {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return {
      debugSource: asString(input.debugSource),
    };
  }

  return {
    debugSource: "",
  };
}

export function serializeOrderCartError(error) {
  return {
    name: asString(error?.name),
    message: asString(error?.message),
    status: toNumber(error?.response?.status),
    statusText: asString(error?.response?.statusText),
    apiMessage: asString(
      firstDefined(
        error?.response?.data?.message,
        error?.response?.data?.title,
        error?.response?.data?.error,
      ),
    ),
    responseData: error?.response?.data ?? null,
  };
}

export function logOrderCartFlow(event, details = {}) {
  console.log(`[OrderCartFlow] ${event}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}
