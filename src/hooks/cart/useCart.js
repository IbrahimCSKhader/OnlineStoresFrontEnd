import { useQuery } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import {
  clearCartReference,
  resolveCartRequestId,
  syncCartReference,
} from "../../utils/cartSession.js";
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

      const cartRequestId = resolveCartRequestId({ storeId });

      if (!cartRequestId) {
        return {
          id: "",
          storeId: storeId ? String(storeId) : "",
          items: [],
          subtotal: 0,
          totalAmount: 0,
          itemCount: 0,
          totalItems: 0,
        };
      }

      try {
        const data = await cartApi.getCart(cartRequestId);
        syncCartReference(data, { storeId });
        return data;
      } catch (error) {
        if (error?.response?.status === 404) {
          clearCartReference({ storeId });
          return {
            id: "",
            storeId: storeId ? String(storeId) : "",
            items: [],
            subtotal: 0,
            totalAmount: 0,
            itemCount: 0,
            totalItems: 0,
          };
        }

        throw error;
      }
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
