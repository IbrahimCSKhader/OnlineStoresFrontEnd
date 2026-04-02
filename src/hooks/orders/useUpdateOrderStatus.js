import { useMutation, useQueryClient } from "@tanstack/react-query";
import orderApi from "../../API/order.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useUpdateOrderStatus(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }) =>
      orderApi.updateOrderStatus(orderId, payload),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byStore(storeId),
        });
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}
