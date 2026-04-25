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
      const resolvedStoreId = data?.storeId || storeId;
      const orderId = data?.id || variables?.orderId;
      const orderItems = Array.isArray(data?.items) ? data.items : [];

      if (resolvedStoreId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byStore(resolvedStoreId),
        });
        queryClient.invalidateQueries({
          queryKey: ["products", "store", resolvedStoreId],
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.featured(resolvedStoreId),
        });
      }

      if (resolvedStoreId && orderId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.storeDetail(resolvedStoreId, orderId),
        });
      }

      for (const item of orderItems) {
        if (item?.productId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.products.detail(item.productId),
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["products", "category"] });
      queryClient.invalidateQueries({ queryKey: ["products", "section"] });

      options.onSuccess?.(data, variables, context);
    },
  });
}
