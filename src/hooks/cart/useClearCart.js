import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useClearCart(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clearCart(storeId),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.setQueryData(queryKeys.cart.byStore(storeId), {
          id: "",
          userId: "",
          storeId,
          items: [],
          totalAmount: 0,
          totalItems: 0,
        });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
