import { useQuery } from "@tanstack/react-query";
import superAdminDashboardApi from "../../API/superAdminDashboard.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSuperAdminStoreDetails(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.superAdmin.storeDetail(storeId),
    queryFn: () => superAdminDashboardApi.getStoreDetails(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
