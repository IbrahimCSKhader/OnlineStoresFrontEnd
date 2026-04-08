import { useMutation, useQueryClient } from "@tanstack/react-query";
import orderApi from "../../API/order.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

function buildCreateOrderPayload(payload, storeId) {
  return {
    storeId: storeId || payload?.storeId,
    couponCode: String(payload?.couponCode || "").trim() || undefined,
    customerNotes: String(payload?.customerNotes || "").trim() || undefined,
    deliveryAddress: String(payload?.deliveryAddress || "").trim(),
    deliveryCity: String(payload?.deliveryCity || "").trim(),
    deliveryPhone: String(payload?.deliveryPhone || "").trim(),
  };
}

export default function useCreateOrder(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => orderApi.createOrder(buildCreateOrderPayload(payload, storeId)),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.byStore(storeId) });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.orders.mine });
      options.onSuccess?.(data, variables, context);
    },
  });
}
