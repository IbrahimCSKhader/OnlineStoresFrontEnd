import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useRemoveCartItem(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.removeCartItem,
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.setQueryData(queryKeys.cart.byStore(storeId), data);
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
