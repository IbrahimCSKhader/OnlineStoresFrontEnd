import { useQuery } from "@tanstack/react-query";
import reviewApi from "../../API/review.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreReviews(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.byStore(storeId),
    queryFn: () => reviewApi.getReviewsByStore(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
