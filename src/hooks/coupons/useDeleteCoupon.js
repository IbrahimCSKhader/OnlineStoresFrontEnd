import { useMutation, useQueryClient } from "@tanstack/react-query";
import couponApi from "../../API/coupon.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useDeleteCoupon(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: couponApi.deleteCoupon,
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.coupons.byStore(storeId) });
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}
