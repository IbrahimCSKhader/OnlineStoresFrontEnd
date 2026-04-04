import { useMutation, useQueryClient } from "@tanstack/react-query";
import superAdminDashboardApi from "../../API/superAdminDashboard.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useUpdateSuperAdminOwnerStatus(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ownerId, payload }) =>
      superAdminDashboardApi.setOwnerStatus(ownerId, payload),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.owners });
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdmin.ownerDetail(variables?.ownerId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.stores });
      options.onSuccess?.(data, variables, context);
    },
  });
}
