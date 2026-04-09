import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { clearGuestCart } from "../../utils/guestCart.js";
import {
  buildOrderCartActor,
  buildStorefrontSessionSummary,
  getCartDebugSummary,
  logOrderCartFlow,
  normalizeClearCartMutationInput,
  serializeOrderCartError,
} from "../../utils/orderCartDebug.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useAuth from "../auth/useAuth.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

export default function useClearCart(storeId, options = {}) {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const storefrontSession = useStorefrontSession(storeId);
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    storefrontSession;

  return useMutation({
    mutationFn: async (input) => {
      const { debugSource } = normalizeClearCartMutationInput(input);
      const actor = buildOrderCartActor({
        auth,
        storefrontSession,
        storeId,
      });

      logOrderCartFlow("Cart Clear Request", {
        status: "request",
        source: debugSource || "unknown",
        transport: useLocalGuestCart ? "local-guest-cart" : "api",
        actor,
      });

      try {
        if (useLocalGuestCart) {
          return clearGuestCart(storeId);
        }

        if (!hasScopedStorefrontSession) {
          const ensuredSession = await ensureStorefrontSession();

          logOrderCartFlow("Cart Clear Session Ready", {
            status: "session-ready",
            source: debugSource || "unknown",
            actor,
            ensuredSession: buildStorefrontSessionSummary(ensuredSession),
          });
        }

        return await cartApi.clearCart(storeId);
      } catch (error) {
        logOrderCartFlow("Cart Clear Request Failed", {
          status: "request-failed",
          source: debugSource || "unknown",
          actor,
          error: serializeOrderCartError(error),
        });
        throw error;
      }
    },
    ...options,
    onMutate: async (variables) => {
      const normalizedInput = normalizeClearCartMutationInput(variables);
      const previousCart = storeId
        ? queryClient.getQueryData(queryKeys.cart.byStore(storeId))
        : undefined;

      logOrderCartFlow("Cart Clear Started", {
        status: "started",
        source: normalizedInput.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        previousCart:
          previousCart !== undefined ? getCartDebugSummary(previousCart) : null,
      });

      const userContext = await options.onMutate?.(variables);

      return {
        previousCart,
        userContext,
      };
    },
    onError: (error, variables, context) => {
      const normalizedInput = normalizeClearCartMutationInput(variables);

      logOrderCartFlow("Cart Clear Failed", {
        status: "failed",
        source: normalizedInput.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        rollbackCart:
          context?.previousCart !== undefined
            ? getCartDebugSummary(context.previousCart)
            : null,
        error: serializeOrderCartError(error),
      });

      options.onError?.(error, variables, context?.userContext ?? context);
    },
    onSuccess: (data, variables, context) => {
      const normalizedInput = normalizeClearCartMutationInput(variables);
      const emptyCart = useLocalGuestCart
        ? data
        : {
            id: "",
            storeCustomerId: "",
            storeId,
            items: [],
            subtotal: 0,
            totalAmount: 0,
            itemCount: 0,
            totalItems: 0,
          };

      if (storeId) {
        queryClient.setQueryData(queryKeys.cart.byStore(storeId), emptyCart);
      }

      logOrderCartFlow("Cart Clear Succeeded", {
        status: "success",
        source: normalizedInput.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        cart: getCartDebugSummary(emptyCart),
        apiResponse: data,
      });

      options.onSuccess?.(data, variables, context?.userContext ?? context);
    },
  });
}
