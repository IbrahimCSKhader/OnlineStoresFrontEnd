import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import { updateGuestCartItem } from "../../utils/guestCart.js";
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

export default function useUpdateCartItem(storeId, options = {}) {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const storefrontSession = useStorefrontSession(storeId);
  const { useLocalGuestCart, hasScopedStorefrontSession, ensureStorefrontSession } =
    storefrontSession;

  const hasCartShape = (value) => {
    if (!value || typeof value !== "object") return false;

    const entity = value?.data && typeof value.data === "object" ? value.data : value;
    return Array.isArray(entity?.items) || Array.isArray(entity?.cartItems);
  };

  return useMutation({
    mutationFn: async (input) => {
      const { cartItemId, payload, debugSource } = normalizeCartItemMutationInput(input);
      const actor = buildOrderCartActor({
        auth,
        storefrontSession,
        storeId,
      });

      logOrderCartFlow("Cart Item Update Request", {
        status: "request",
        source: debugSource || "unknown",
        transport: useLocalGuestCart ? "local-guest-cart" : "api",
        actor,
        cartItemId,
        payload,
      });

      try {
        if (useLocalGuestCart) {
          return updateGuestCartItem(storeId, cartItemId, payload);
        }

        if (!hasScopedStorefrontSession) {
          const ensuredSession = await ensureStorefrontSession();

          logOrderCartFlow("Cart Item Update Session Ready", {
            status: "session-ready",
            source: debugSource || "unknown",
            actor,
            ensuredSession: buildStorefrontSessionSummary(ensuredSession),
          });
        }

        return await cartApi.updateCartItem(cartItemId, payload);
      } catch (error) {
        logOrderCartFlow("Cart Item Update Request Failed", {
          status: "request-failed",
          source: debugSource || "unknown",
          actor,
          cartItemId,
          payload,
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

      logOrderCartFlow("Cart Item Update Started", {
        status: "started",
        source: normalizedInput.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        cartItemId: normalizedInput.cartItemId,
        payload: normalizedInput.payload,
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

      logOrderCartFlow("Cart Item Update Failed", {
        status: "failed",
        source: normalizedInput.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        cartItemId: normalizedInput.cartItemId,
        payload: normalizedInput.payload,
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
        if (hasCartShape(data)) {
          queryClient.setQueryData(queryKeys.cart.byStore(storeId), data);
        } else {
          queryClient.invalidateQueries({
            queryKey: queryKeys.cart.byStore(storeId),
          });
        }
      }

      logOrderCartFlow("Cart Item Update Succeeded", {
        status: "success",
        source: normalizedInput.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        cartItemId: normalizedInput.cartItemId,
        payload: normalizedInput.payload,
        cart: hasCartShape(data) ? getCartDebugSummary(data, normalizedInput) : null,
        responseHasCartShape: hasCartShape(data),
        apiResponse: data,
      });

      options.onSuccess?.(data, variables, context?.userContext ?? context);
    },
  });
}
