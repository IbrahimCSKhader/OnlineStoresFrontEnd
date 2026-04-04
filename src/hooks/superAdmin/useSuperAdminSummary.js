import { useQuery } from "@tanstack/react-query";
import superAdminDashboardApi from "../../API/superAdminDashboard.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSuperAdminSummary(options = {}) {
  return useQuery({
    queryKey: queryKeys.superAdmin.summary,
    queryFn: superAdminDashboardApi.getSummary,
    ...options,
  });
}
