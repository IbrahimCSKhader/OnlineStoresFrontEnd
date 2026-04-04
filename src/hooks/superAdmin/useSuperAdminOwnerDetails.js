import { useQuery } from "@tanstack/react-query";
import superAdminDashboardApi from "../../API/superAdminDashboard.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSuperAdminOwnerDetails(ownerId, options = {}) {
  return useQuery({
    queryKey: queryKeys.superAdmin.ownerDetail(ownerId),
    queryFn: () => superAdminDashboardApi.getOwnerDetails(ownerId),
    enabled: Boolean(ownerId) && (options.enabled ?? true),
    ...options,
  });
}
