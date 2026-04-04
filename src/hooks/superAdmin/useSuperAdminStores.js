import { useQuery } from "@tanstack/react-query";
import superAdminDashboardApi from "../../API/superAdminDashboard.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSuperAdminStores(options = {}) {
  return useQuery({
    queryKey: queryKeys.superAdmin.stores,
    queryFn: superAdminDashboardApi.getStores,
    ...options,
  });
}
