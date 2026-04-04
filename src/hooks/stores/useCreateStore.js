import { useMutation, useQueryClient } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCreateStore(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeApi.createStore,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.stores });
      options.onSuccess?.(data, variables, context);
    },
  });
}
