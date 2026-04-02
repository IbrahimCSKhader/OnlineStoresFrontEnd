import { useMutation, useQueryClient } from "@tanstack/react-query";
import couponApi from "../../API/coupon.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useUpdateCoupon(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => couponApi.updateCoupon(id, payload),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coupons.byStore(storeId),
        });
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}
