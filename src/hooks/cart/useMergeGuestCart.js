import { useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import useAuthStore from "../../store/authStore.js";
import { syncCartReference } from "../../utils/cartSession.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { isStoreCustomerRole } from "../../utils/roles.js";
import { clearGuestCart, getAllGuestCarts } from "../../utils/guestCart.js";

export default function useMergeGuestCart() {
  const queryClient = useQueryClient();

  return async function mergeGuestCart() {
    const { role, user } = useAuthStore.getState();
    const hasStoreCustomerSession =
      isStoreCustomerRole(role) || isStoreCustomerRole(user?.accountType);

    if (!hasStoreCustomerSession) {
      return {
        success: false,
        skipped: true,
      };
    }

    queryClient.removeQueries({ queryKey: ["cart"] });

    const guestCarts = getAllGuestCarts().filter(
      (cart) => cart?.storeId && Array.isArray(cart.items) && cart.items.length,
    );

    let firstError = null;

    for (const cart of guestCarts) {
      let lastServerCart = null;
      let completed = true;

      for (const item of cart.items) {
        try {
          lastServerCart = await cartApi.addToCart({
            productId: item.productId,
            quantity: item.quantity,
            storeId: cart.storeId,
            variantId: item.variantId || null,
          });
        } catch (error) {
          completed = false;
          firstError = firstError || error;
          break;
        }
      }

      if (lastServerCart) {
        syncCartReference(lastServerCart, { storeId: cart.storeId });
        queryClient.setQueryData(queryKeys.cart.byStore(cart.storeId), lastServerCart);
      }

      if (completed) {
        clearGuestCart(cart.storeId);
      }
    }

    return {
      success: !firstError,
      error: firstError,
    };
  };
}
