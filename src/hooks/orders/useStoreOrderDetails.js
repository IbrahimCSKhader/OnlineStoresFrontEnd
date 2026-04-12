import { useQuery } from "@tanstack/react-query";
import orderApi from "../../API/order.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreOrderDetails(storeId, orderId, options = {}) {
  return useQuery({
    queryKey: queryKeys.orders.storeDetail(storeId, orderId),
    queryFn: () => orderApi.getStoreOrderById(storeId, orderId),
    enabled: Boolean(storeId) && Boolean(orderId) && (options.enabled ?? true),
    ...options,
  });
}
