import { useQuery } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCart(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.cart.byStore(storeId),
    queryFn: () => cartApi.getCart(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
    ...options,
  });
}
