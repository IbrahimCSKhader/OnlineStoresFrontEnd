import { useMutation, useQueryClient } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useChangeStoreSubscription(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planKey, payload }) =>
      storeApi.changeStoreSubscription(storeId, {
        plan: planKey,
        ...payload,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.stores.subscription(storeId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.stores.detail(storeId),
        });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      options.onSuccess?.(data, variables, context);
    },
  });
}
