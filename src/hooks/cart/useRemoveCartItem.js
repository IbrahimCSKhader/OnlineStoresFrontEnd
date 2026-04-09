import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { removeGuestCartItem } from "../../utils/guestCart.js";
import {
  buildOrderCartActor,
  buildStorefrontSessionSummary,
  getCartDebugSummary,
  logOrderCartFlow,
  normalizeCartItemMutationInput,
  serializeOrderCartError,
} from "../../utils/orderCartDebug.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useAuth from "../auth/useAuth.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

export default function useRemoveCartItem(storeId, options = {}) {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const storefrontSession = useStorefrontSession(storeId);
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    storefrontSession;

  return useMutation({
    mutationFn: async (input) => {
      const { cartItemId, debugSource } = normalizeCartItemMutationInput(input);
      const actor = buildOrderCartActor({
        auth,
        storefrontSession,
        storeId,
      });

      logOrderCartFlow("Cart Item Remove Request", {
        status: "request",
        source: debugSource || "unknown",
        transport: useLocalGuestCart ? "local-guest-cart" : "api",
        actor,
        cartItemId,
      });

      try {
        if (useLocalGuestCart) {
          return removeGuestCartItem(storeId, cartItemId);
        }

        if (!hasScopedStorefrontSession) {
          const ensuredSession = await ensureStorefrontSession();

          logOrderCartFlow("Cart Item Remove Session Ready", {
            status: "session-ready",
            source: debugSource || "unknown",
            actor,
            ensuredSession: buildStorefrontSessionSummary(ensuredSession),
          });
        }

        return await cartApi.removeCartItem(cartItemId);
      } catch (error) {
        logOrderCartFlow("Cart Item Remove Request Failed", {
          status: "request-failed",
          source: debugSource || "unknown",
          actor,
          cartItemId,
          error: serializeOrderCartError(error),
        });
        throw error;
      }
    },
    ...options,
    onMutate: async (variables) => {
      const normalizedInput = normalizeCartItemMutationInput(variables);
      const previousCart = storeId
        ? queryClient.getQueryData(queryKeys.cart.byStore(storeId))
        : undefined;

      logOrderCartFlow("Cart Item Remove Started", {
        status: "started",
        source: normalizedInput.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        cartItemId: normalizedInput.cartItemId,
        previousCart:
          previousCart !== undefined
            ? getCartDebugSummary(previousCart, normalizedInput)
            : null,
      });

      const userContext = await options.onMutate?.(variables);

      return {
        previousCart,
        userContext,
      };
    },
    onError: (error, variables, context) => {
      const normalizedInput = normalizeCartItemMutationInput(variables);

      logOrderCartFlow("Cart Item Remove Failed", {
        status: "failed",
        source: normalizedInput.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        cartItemId: normalizedInput.cartItemId,
        rollbackCart:
          context?.previousCart !== undefined
            ? getCartDebugSummary(context.previousCart, normalizedInput)
            : null,
        error: serializeOrderCartError(error),
      });

      options.onError?.(error, variables, context?.userContext ?? context);
    },
    onSuccess: (data, variables, context) => {
      const normalizedInput = normalizeCartItemMutationInput(variables);

      if (storeId) {
        queryClient.setQueryData(queryKeys.cart.byStore(storeId), data);
      }

      logOrderCartFlow("Cart Item Remove Succeeded", {
        status: "success",
        source: normalizedInput.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        cartItemId: normalizedInput.cartItemId,
        cart: getCartDebugSummary(data),
        apiResponse: data,
      });

      options.onSuccess?.(data, variables, context?.userContext ?? context);
    },
  });
}
