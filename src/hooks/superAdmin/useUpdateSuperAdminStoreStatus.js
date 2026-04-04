import { useMutation, useQueryClient } from "@tanstack/react-query";
import superAdminDashboardApi from "../../API/superAdminDashboard.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useUpdateSuperAdminStoreStatus(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, payload }) =>
      superAdminDashboardApi.setStoreStatus(storeId, payload),
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
      options.onSuccess?.(data, variables, context);
    },
  });
}
