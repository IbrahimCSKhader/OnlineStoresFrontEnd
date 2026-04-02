import { useMutation, useQueryClient } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useDeleteStore(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeApi.deleteStore,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      options.onSuccess?.(data, variables, context);
    },
  });
}
