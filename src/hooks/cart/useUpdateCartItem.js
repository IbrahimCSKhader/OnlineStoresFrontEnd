import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { updateGuestCartItem } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

export default function useUpdateCartItem(storeId, options = {}) {
  const queryClient = useQueryClient();
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    useStorefrontSession(storeId);

  return useMutation({
    mutationFn: async ({ cartItemId, payload }) => {
      if (useLocalGuestCart) {
        return updateGuestCartItem(storeId, cartItemId, payload);
      }

      if (!hasScopedStorefrontSession) {
        await ensureStorefrontSession();
      }

      return cartApi.updateCartItem(cartItemId, payload);
    },
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.setQueryData(queryKeys.cart.byStore(storeId), data);
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
