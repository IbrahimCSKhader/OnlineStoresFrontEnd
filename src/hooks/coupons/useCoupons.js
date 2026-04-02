import { useQuery } from "@tanstack/react-query";
import couponApi from "../../API/coupon.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCoupons(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.coupons.byStore(storeId),
    queryFn: () => couponApi.getCouponsByStore(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
