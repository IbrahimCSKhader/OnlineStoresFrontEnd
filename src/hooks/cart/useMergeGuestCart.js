import { useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import useAuthStore from "../../store/authStore.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { isStoreCustomerRole } from "../../utils/roles.js";
import { clearGuestCart, getAllGuestCarts } from "../../utils/guestCart.js";
import { normalizeCartResponse } from "../../utils/storefront.js";

function toNumber(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

function getCartItemKey(item) {
  return `${String(item?.productId || "")}::${String(item?.variantId || "")}`;
}

function hasCartShape(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entity = value?.data && typeof value.data === "object" ? value.data : value;
  return Array.isArray(entity?.items) || Array.isArray(entity?.cartItems);
}

function resolveStockLimit(primaryItem, fallbackItem = null) {
  const primaryStock = toNumber(primaryItem?.availableStock, NaN);

  if (Number.isFinite(primaryStock) && primaryStock >= 0) {
    return primaryStock;
  }

  const fallbackStock = toNumber(fallbackItem?.availableStock, NaN);

  if (Number.isFinite(fallbackStock) && fallbackStock >= 0) {
    return fallbackStock;
  }

  return Number.POSITIVE_INFINITY;
}

function clampQuantity(quantity, stockLimit) {
  const normalizedQuantity = Math.max(0, toNumber(quantity, 0));

  if (!Number.isFinite(stockLimit)) {
    return normalizedQuantity;
  }

  return Math.max(0, Math.min(normalizedQuantity, stockLimit));
}

function buildEmptyServerCart(storeId) {
  return normalizeCartResponse({
    id: "",
    storeId,
    storeCustomerId: "",
    items: [],
    subtotal: 0,
    totalAmount: 0,
    itemCount: 0,
    totalItems: 0,
  });
}

async function resolveServerCart(storeId, response = null) {
  if (hasCartShape(response)) {
    return normalizeCartResponse(response);
  }

  try {
    const freshCart = await cartApi.getCart(storeId);
    return normalizeCartResponse(freshCart);
  } catch (error) {
    if (error?.response?.status === 404) {
      return buildEmptyServerCart(storeId);
    }

    throw error;
  }
}

export default function useMergeGuestCart() {
  const queryClient = useQueryClient();

  return async function mergeGuestCart() {
    const { storefrontSession } = useAuthStore.getState();
    const role = storefrontSession?.role;
    const user = storefrontSession?.user;
    const hasStoreCustomerSession =
      isStoreCustomerRole(role) || isStoreCustomerRole(user?.accountType);
    const activeStoreId = String(user?.storeId || user?.StoreId || user?.store?.id || "").trim();

    if (!hasStoreCustomerSession) {
      return {
        success: false,
        skipped: true,
      };
    }

    const guestCarts = getAllGuestCarts().filter(
      (cart) =>
        cart?.storeId &&
        Array.isArray(cart.items) &&
        cart.items.length &&
        (!activeStoreId || String(cart.storeId) === activeStoreId),
    );

    if (!guestCarts.length) {
      return {
        success: true,
        skipped: true,
      };
    }

    queryClient.removeQueries({ queryKey: ["cart"] });

    let firstError = null;
    const mergedStores = [];

    for (const localCart of guestCarts) {
      const storeId = String(localCart.storeId || "").trim();

      if (!storeId) {
        continue;
      }

      let completed = true;

      try {
        let serverCart = await resolveServerCart(storeId);

        for (const localItem of localCart.items) {
          const localQuantity = Math.max(1, toNumber(localItem.quantity, 1));
          const matchingServerItem =
            serverCart.items.find((item) => getCartItemKey(item) === getCartItemKey(localItem)) || null;
          const currentServerQuantity = toNumber(matchingServerItem?.quantity, 0);
          const stockLimit = matchingServerItem
            ? resolveStockLimit(matchingServerItem, localItem)
            : resolveStockLimit(localItem);
          const targetQuantity = clampQuantity(
            currentServerQuantity + localQuantity,
            stockLimit,
          );

          if (targetQuantity <= currentServerQuantity || targetQuantity <= 0) {
            continue;
          }

          if (matchingServerItem?.id) {
            const updateResponse = await cartApi.updateCartItem(matchingServerItem.id, {
              quantity: targetQuantity,
            });
            serverCart = await resolveServerCart(storeId, updateResponse);
            continue;
          }

          const addQuantity = clampQuantity(localQuantity, stockLimit);

          if (addQuantity <= 0) {
            continue;
          }

          const addResponse = await cartApi.addToCart({
            productId: localItem.productId,
            quantity: addQuantity,
            storeId,
            variantId: localItem.variantId || null,
          });
          serverCart = await resolveServerCart(storeId, addResponse);
        }

        queryClient.setQueryData(queryKeys.cart.byStore(storeId), serverCart);
        clearGuestCart(storeId);
        mergedStores.push(storeId);
      } catch (error) {
        completed = false;
        firstError = firstError || error;
      }

      if (!completed) {
        break;
      }
    }

    return {
      success: !firstError,
      error: firstError,
      mergedStores,
    };
  };
}
