import { useMutation, useQueryClient } from "@tanstack/react-query";
import orderApi from "../../API/order.api.js";
import {
  buildOrderCartActor,
  getCartDebugSummary,
  getOrderDebugSummary,
  logOrderCartFlow,
  serializeOrderCartError,
} from "../../utils/orderCartDebug.js";
import {
  buildOrderStatusPayload,
  ORDER_STATUS,
} from "../../utils/orderStatus.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useAuth from "../auth/useAuth.js";
import useStorefrontSession from "../auth/useStorefrontSession.js";

function buildCreateOrderPayload(payload, storeId) {
  return buildOrderStatusPayload(ORDER_STATUS.PENDING, {
    storeId: storeId || payload?.storeId,
    couponCode: String(payload?.couponCode || "").trim() || undefined,
    customerNotes: String(payload?.customerNotes || "").trim() || undefined,
    deliveryAddress: String(payload?.deliveryAddress || "").trim(),
    deliveryCity: String(payload?.deliveryCity || "").trim(),
    deliveryPhone: String(payload?.deliveryPhone || "").trim(),
  });
}

export default function useCreateOrder(storeId, options = {}) {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const storefrontSession = useStorefrontSession(storeId);

  return useMutation({
    mutationFn: async (payload) => {
      const requestPayload = buildCreateOrderPayload(payload, storeId);
      const actor = buildOrderCartActor({
        auth,
        storefrontSession,
        storeId,
      });

      logOrderCartFlow("Create Order Request", {
        status: "request",
        source: payload?.debugSource || "unknown",
        actor,
        requestPayload,
      });

      try {
        return await orderApi.createOrder(requestPayload);
      } catch (error) {
        logOrderCartFlow("Create Order Request Failed", {
          status: "request-failed",
          source: payload?.debugSource || "unknown",
          actor,
          requestPayload,
          error: serializeOrderCartError(error),
        });
        throw error;
      }
    },
    ...options,
    onMutate: async (variables) => {
      const requestPayload = buildCreateOrderPayload(variables, storeId);
      const currentCart = storeId
        ? queryClient.getQueryData(queryKeys.cart.byStore(storeId))
        : undefined;

      logOrderCartFlow("Create Order Started", {
        status: "started",
        source: variables?.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        requestPayload,
        cart:
          currentCart !== undefined ? getCartDebugSummary(currentCart) : null,
      });

      const userContext = await options.onMutate?.(variables);

      return {
        currentCart,
        userContext,
      };
    },
    onError: (error, variables, context) => {
      logOrderCartFlow("Create Order Failed", {
        status: "failed",
        source: variables?.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        requestPayload: buildCreateOrderPayload(variables, storeId),
        cart:
          context?.currentCart !== undefined
            ? getCartDebugSummary(context.currentCart)
            : null,
        error: serializeOrderCartError(error),
      });

      options.onError?.(error, variables, context?.userContext ?? context);
    },
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.byStore(storeId) });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.orders.mine });

      logOrderCartFlow("Create Order Succeeded", {
        status: "success",
        source: variables?.debugSource || "unknown",
        actor: buildOrderCartActor({
          auth,
          storefrontSession,
          storeId,
        }),
        requestPayload: buildCreateOrderPayload(variables, storeId),
        order: getOrderDebugSummary(data),
        previousCart:
          context?.currentCart !== undefined
            ? getCartDebugSummary(context.currentCart)
            : null,
        apiResponse: data,
      });

      options.onSuccess?.(data, variables, context?.userContext ?? context);
    },
  });
}
