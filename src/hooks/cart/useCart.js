import { useQuery } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { getGuestCart } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

export default function useCart(storeId, options = {}) {
  const { autoCreateSession = true, ...queryOptions } = options;
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    useStorefrontSession(storeId);
  const shouldUseLocalGuestCart =
    useLocalGuestCart || (!hasScopedStorefrontSession && !autoCreateSession);

  return useQuery({
    queryKey: queryKeys.cart.byStore(storeId),
    queryFn: async () => {
      if (shouldUseLocalGuestCart) {
        return getGuestCart(storeId);
      }

      if (!hasScopedStorefrontSession) {
        await ensureStorefrontSession();
      }

      return cartApi.getCart(storeId);
    },
    enabled: Boolean(storeId) && (queryOptions.enabled ?? true),
    retry: (failureCount, error) => {
      if (shouldUseLocalGuestCart) return false;
      if (error?.response?.status === 401 || error?.response?.status === 403) return false;
      return failureCount < 2;
    },
    ...queryOptions,
  });
}
