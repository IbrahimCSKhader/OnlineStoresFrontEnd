import { useQuery } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { getGuestCart } from "../../utils/guestCart.js";
import {
  buildOrderCartActor,
  buildStorefrontSessionSummary,
  getCartDebugSummary,
  logOrderCartFlow,
  serializeOrderCartError,
} from "../../utils/orderCartDebug.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useAuth from "../auth/useAuth.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

export default function useCart(storeId, options = {}) {
  const { autoCreateSession = true, ...queryOptions } = options;
  const auth = useAuth();
  const storefrontSession = useStorefrontSession(storeId);
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    storefrontSession;
  const shouldUseLocalGuestCart =
    useLocalGuestCart || (!hasScopedStorefrontSession && !autoCreateSession);

  return useQuery({
    queryKey: queryKeys.cart.byStore(storeId),
    queryFn: async () => {
      const actor = buildOrderCartActor({
        auth,
        storefrontSession,
        storeId,
      });

      logOrderCartFlow("Cart Fetch Started", {
        status: "started",
        transport: shouldUseLocalGuestCart ? "local-guest-cart" : "api",
        actor,
      });

      try {
        if (shouldUseLocalGuestCart) {
          const localCart = getGuestCart(storeId);

          logOrderCartFlow("Cart Fetch Succeeded", {
            status: "success",
            transport: "local-guest-cart",
            actor,
            cart: getCartDebugSummary(localCart),
            apiResponse: localCart,
          });

          return localCart;
        }

        if (!hasScopedStorefrontSession) {
          const ensuredSession = await ensureStorefrontSession();

          logOrderCartFlow("Cart Fetch Session Ready", {
            status: "session-ready",
            actor,
            ensuredSession: buildStorefrontSessionSummary(ensuredSession),
            ensuredCart:
              ensuredSession?.cart !== undefined
                ? getCartDebugSummary(ensuredSession.cart)
                : null,
          });
        }

        const serverCart = await cartApi.getCart(storeId);

        logOrderCartFlow("Cart Fetch Succeeded", {
          status: "success",
          transport: "api",
          actor,
          cart: getCartDebugSummary(serverCart),
          apiResponse: serverCart,
        });

        return serverCart;
      } catch (error) {
        logOrderCartFlow("Cart Fetch Failed", {
          status: "failed",
          transport: shouldUseLocalGuestCart ? "local-guest-cart" : "api",
          actor,
          error: serializeOrderCartError(error),
        });
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
