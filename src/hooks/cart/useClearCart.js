import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { clearGuestCart } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

export default function useClearCart(storeId, options = {}) {
  const queryClient = useQueryClient();
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    useStorefrontSession(storeId);

  return useMutation({
    mutationFn: async () => {
      if (useLocalGuestCart) {
        return clearGuestCart(storeId);
      }

      if (!hasScopedStorefrontSession) {
        await ensureStorefrontSession();
      }

      return cartApi.clearCart(storeId);
    },
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.setQueryData(
          queryKeys.cart.byStore(storeId),
          useLocalGuestCart
            ? data
            : {
                id: "",
                storeCustomerId: "",
                storeId,
                items: [],
                subtotal: 0,
                totalAmount: 0,
                itemCount: 0,
                totalItems: 0,
              },
        );
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
