import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import useAuth from "../auth/useAuth.js";
import { updateGuestCartItem } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useUpdateCartItem(storeId, options = {}) {
  const queryClient = useQueryClient();
  const { isStoreCustomer } = useAuth();

  return useMutation({
    mutationFn: ({ cartItemId, payload }) =>
      isStoreCustomer
        ? cartApi.updateCartItem(cartItemId, payload)
        : updateGuestCartItem(storeId, cartItemId, payload),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.setQueryData(queryKeys.cart.byStore(storeId), data);
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
