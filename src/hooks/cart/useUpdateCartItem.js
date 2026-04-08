import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { syncCartReference } from "../../utils/cartSession.js";
import { updateGuestCartItem } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

export default function useUpdateCartItem(storeId, options = {}) {
  const queryClient = useQueryClient();
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    useStorefrontSession(storeId);

  const hasCartShape = (value) => {
    if (!value || typeof value !== "object") return false;

    const entity = value?.data && typeof value.data === "object" ? value.data : value;
    return Array.isArray(entity?.items) || Array.isArray(entity?.cartItems);
  };

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
        syncCartReference(data, { storeId });
        if (hasCartShape(data)) {
          queryClient.setQueryData(queryKeys.cart.byStore(storeId), data);
        } else {
          queryClient.invalidateQueries({
            queryKey: queryKeys.cart.byStore(storeId),
          });
        }
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
