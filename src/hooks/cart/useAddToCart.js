import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { addGuestCartItem } from "../../utils/guestCart.js";
import {
  buildOrderCartActor,
  buildStorefrontSessionSummary,
  getCartDebugSummary,
  logOrderCartFlow,
  serializeOrderCartError,
} from "../../utils/orderCartDebug.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { normalizeCartResponse } from "../../utils/storefront.js";
import useAuth from "../auth/useAuth.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

function toNumber(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

function clampQuantityToStock(quantity, availableStock) {
  const normalizedQuantity = Math.max(1, toNumber(quantity, 1));
  const normalizedStock = Number(availableStock);

  if (!Number.isFinite(normalizedStock)) {
    return normalizedQuantity;
  }

  if (normalizedStock <= 0) {
    return 0;
  }

  return Math.min(normalizedQuantity, Math.max(1, Math.trunc(normalizedStock)));
}

function getCartLineKey(productId, variantId) {
  return `${String(productId || "")}::${String(variantId || "default")}`;
}

function buildOptimisticCart(currentCart, payload, storeId) {
  if (!payload?.productId || !storeId) {
    return currentCart;
  }

  const normalizedCart = normalizeCartResponse(currentCart);
  const variantId = payload.variantId ? String(payload.variantId) : "";
  const itemId = getCartLineKey(payload.productId, variantId);
  const existingItem = normalizedCart.items.find(
    (item) =>
      item.id === itemId ||
      getCartLineKey(item.productId, item.variantId) === itemId,
  );
  const snapshot = payload.productSnapshot || {};
  const availableStock = toNumber(snapshot.availableStock, toNumber(existingItem?.availableStock, NaN));
  const unitPrice = toNumber(snapshot.unitPrice, toNumber(existingItem?.unitPrice));
  const quantity = clampQuantityToStock(
    toNumber(existingItem?.quantity, 0) + toNumber(payload.quantity, 1),
    availableStock,
  );

  if (quantity <= 0) {
    return normalizedCart;
  }

  const nextItem = {
    ...existingItem,
    id: existingItem?.id || itemId,
    productId: String(payload.productId),
    variantId,
    variantName: snapshot.variantName || existingItem?.variantName || "",
    variantSku: snapshot.variantSku || existingItem?.variantSku || "",
    variantAttributes: snapshot.variantAttributes || existingItem?.variantAttributes || "",
    name: snapshot.name || existingItem?.name || "منتج",
    slug: snapshot.slug || existingItem?.slug || "",
    imageUrl: snapshot.imageUrl || existingItem?.imageUrl || "",
    variantImageUrl: snapshot.variantImageUrl || existingItem?.variantImageUrl || "",
    effectiveVariantImageUrl:
      snapshot.effectiveVariantImageUrl ||
      snapshot.variantImageUrl ||
      existingItem?.effectiveVariantImageUrl ||
      existingItem?.variantImageUrl ||
      "",
    availableStock,
    unitPrice,
    quantity,
    totalPrice: unitPrice * quantity,
  };

  const items = existingItem
    ? normalizedCart.items.map((item) =>
        item.id === existingItem.id ? nextItem : item,
      )
    : [...normalizedCart.items, nextItem];
  const subtotal = items.reduce(
    (sum, item) => sum + toNumber(item.totalPrice, toNumber(item.unitPrice) * toNumber(item.quantity, 1)),
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + toNumber(item.quantity, 1), 0);

  return {
    ...normalizedCart,
    storeId: String(storeId),
    items,
    subtotal,
    totalAmount: subtotal,
    itemCount,
    totalItems: itemCount,
  };
}

function buildAddToCartRequest(payload, storeId) {
  const resolvedStoreId = storeId || payload?.storeId;

  return {
    productId: payload?.productId,
    variantId: payload?.variantId || null,
    quantity: Math.max(1, toNumber(payload?.quantity, 1)),
    storeId: resolvedStoreId,
  };
}

export default function useAddToCart(storeId, options = {}) {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const storefrontSession = useStorefrontSession(storeId);
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    storefrontSession;
  const cartQueryKey = queryKeys.cart.byStore(storeId);

  return useMutation({
    mutationFn: async (payload) => {
      const requestPayload = buildAddToCartRequest(payload, storeId);
      const actor = buildOrderCartActor({
        auth,
        storefrontSession,
        storeId,
      });

      logOrderCartFlow("Add To Cart Request", {
        status: "request",
        source: payload?.debugSource || "unknown",
        transport: useLocalGuestCart ? "local-guest-cart" : "api",
        actor,
        requestPayload,
        productSnapshot: payload?.productSnapshot || null,
      });

      try {
        if (useLocalGuestCart) {
          return addGuestCartItem(payload);
        }

        if (!hasScopedStorefrontSession) {
          const ensuredSession = await ensureStorefrontSession();

          logOrderCartFlow("Add To Cart Session Ready", {
            status: "session-ready",
            source: payload?.debugSource || "unknown",
            actor,
            ensuredSession: buildStorefrontSessionSummary(ensuredSession),
            ensuredCart:
              ensuredSession?.cart !== undefined
                ? getCartDebugSummary(ensuredSession.cart, payload)
                : null,
          });
        }

        return await cartApi.addToCart(requestPayload);
      } catch (error) {
        logOrderCartFlow("Add To Cart Request Failed", {
          status: "request-failed",
          source: payload?.debugSource || "unknown",
          actor,
          requestPayload,
          error: serializeOrderCartError(error),
        });
        throw error;
      }
    },
    ...options,
    onMutate: async (variables) => {
      if (storeId) {
        await queryClient.cancelQueries({ queryKey: cartQueryKey });
      }

      const previousCart = storeId ? queryClient.getQueryData(cartQueryKey) : undefined;
      const optimisticCart =
        storeId !== undefined ? buildOptimisticCart(previousCart, variables, storeId) : null;

      if (storeId) {
        queryClient.setQueryData(cartQueryKey, optimisticCart);
      }

      logOrderCartFlow("Add To Cart Started", {
        status: "started",
        source: variables?.debugSource || "unknown",
        transport: useLocalGuestCart ? "local-guest-cart" : "api",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        requestPayload: buildAddToCartRequest(variables, storeId),
        previousCart:
          previousCart !== undefined ? getCartDebugSummary(previousCart, variables) : null,
        optimisticCart:
          optimisticCart !== null ? getCartDebugSummary(optimisticCart, variables) : null,
      });

      const userContext = await options.onMutate?.(variables);

      return {
        previousCart,
        userContext,
      };
    },
    onError: (error, variables, context) => {
      if (storeId && context?.previousCart !== undefined) {
        queryClient.setQueryData(cartQueryKey, context.previousCart);
      }

      logOrderCartFlow("Add To Cart Failed", {
        status: "failed",
        source: variables?.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        requestPayload: buildAddToCartRequest(variables, storeId),
        rollbackCart:
          context?.previousCart !== undefined
            ? getCartDebugSummary(context.previousCart, variables)
            : null,
        error: serializeOrderCartError(error),
      });

      options.onError?.(error, variables, context?.userContext ?? context);
    },
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.setQueryData(cartQueryKey, data);
      }

      logOrderCartFlow("Add To Cart Succeeded", {
        status: "success",
        source: variables?.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        requestPayload: buildAddToCartRequest(variables, storeId),
        cart: getCartDebugSummary(data, variables),
        apiResponse: data,
      });

      options.onSuccess?.(data, variables, context?.userContext ?? context);
    },
    onSettled: (data, error, variables, context) => {
      options.onSettled?.(data, error, variables, context?.userContext ?? context);
    },
  });
}
