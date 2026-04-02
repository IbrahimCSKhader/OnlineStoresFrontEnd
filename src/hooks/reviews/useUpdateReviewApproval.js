import { useMutation, useQueryClient } from "@tanstack/react-query";
import reviewApi from "../../API/review.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useUpdateReviewApproval(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, payload }) =>
      reviewApi.updateReviewApproval(reviewId, payload),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.reviews.byStore(storeId),
        });
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}
