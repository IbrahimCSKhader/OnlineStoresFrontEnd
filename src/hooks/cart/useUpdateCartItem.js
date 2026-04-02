import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useUpdateCartItem(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, payload }) => cartApi.updateCartItem(cartItemId, payload),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.setQueryData(queryKeys.cart.byStore(storeId), data);
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
