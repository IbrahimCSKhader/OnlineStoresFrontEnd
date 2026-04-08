import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { syncCartReference } from "../../utils/cartSession.js";
import { removeGuestCartItem } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

export default function useRemoveCartItem(storeId, options = {}) {
  const queryClient = useQueryClient();
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    useStorefrontSession(storeId);

  return useMutation({
    mutationFn: async (cartItemId) => {
      if (useLocalGuestCart) {
        return removeGuestCartItem(storeId, cartItemId);
      }

      if (!hasScopedStorefrontSession) {
        await ensureStorefrontSession();
      }

      return cartApi.removeCartItem(cartItemId);
    },
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        syncCartReference(data, { storeId });
        queryClient.setQueryData(queryKeys.cart.byStore(storeId), data);
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
