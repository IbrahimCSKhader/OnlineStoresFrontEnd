import { useQuery } from "@tanstack/react-query";
import superAdminDashboardApi from "../../API/superAdminDashboard.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSuperAdminStoreCustomers(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.superAdmin.storeCustomers(storeId),
    queryFn: () => superAdminDashboardApi.getStoreCustomers(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
