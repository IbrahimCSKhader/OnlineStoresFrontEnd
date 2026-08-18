import { useQuery } from "@tanstack/react-query";
import orderApi from "../../API/order.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useMyPurchasePoints(options = {}) {
  return useQuery({
    queryKey: queryKeys.orders.myPoints,
    queryFn: () => orderApi.getMyPoints(),
    ...options,
  });
}
