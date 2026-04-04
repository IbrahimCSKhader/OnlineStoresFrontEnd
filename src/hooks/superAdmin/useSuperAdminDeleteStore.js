import { useMutation, useQueryClient } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSuperAdminDeleteStore(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeApi.deleteStore,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.owners });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.stores });
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      options.onSuccess?.(data, variables, context);
    },
  });
}
