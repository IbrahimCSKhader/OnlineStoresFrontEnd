import { useMutation, useQueryClient } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSuperAdminUpdateStore(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, payload }) => storeApi.updateStore(storeId, payload),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.owners });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.stores });
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdmin.storeDetail(variables?.storeId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdmin.storeCustomers(variables?.storeId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stores.detail(variables?.storeId),
      });
      options.onSuccess?.(data, variables, context);
    },
  });
}
