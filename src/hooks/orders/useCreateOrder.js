import { useMutation, useQueryClient } from "@tanstack/react-query";
import orderApi from "../../API/order.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCreateOrder(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => orderApi.createOrder(payload),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.byStore(storeId) });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.orders.mine });
      options.onSuccess?.(data, variables, context);
    },
  });
}
