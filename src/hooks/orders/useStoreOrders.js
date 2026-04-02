import { useQuery } from "@tanstack/react-query";
import orderApi from "../../API/order.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreOrders(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.orders.byStore(storeId),
    queryFn: () => orderApi.getStoreOrders(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
