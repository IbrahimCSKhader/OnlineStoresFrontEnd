import { useQuery } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import useAuth from "../auth/useAuth.js";
import { getGuestCart } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCart(storeId, options = {}) {
  const { isStoreCustomer } = useAuth();

  return useQuery({
    queryKey: queryKeys.cart.byStore(storeId),
    queryFn: () => (isStoreCustomer ? cartApi.getCart(storeId) : getGuestCart(storeId)),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    retry: (failureCount, error) => {
      if (!isStoreCustomer) return false;
      if (error?.response?.status === 401 || error?.response?.status === 403) return false;
      return failureCount < 2;
    },
    ...options,
  });
}
