import { useQuery } from "@tanstack/react-query";
import orderApi from "../../API/order.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useMyOrders(options = {}) {
  return useQuery({
    queryKey: queryKeys.orders.mine,
    queryFn: () => orderApi.getMyOrders(),
    ...options,
  });
}
