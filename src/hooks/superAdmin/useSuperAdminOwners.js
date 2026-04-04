import { useQuery } from "@tanstack/react-query";
import superAdminDashboardApi from "../../API/superAdminDashboard.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSuperAdminOwners(options = {}) {
  return useQuery({
    queryKey: queryKeys.superAdmin.owners,
    queryFn: superAdminDashboardApi.getOwners,
    ...options,
  });
}
