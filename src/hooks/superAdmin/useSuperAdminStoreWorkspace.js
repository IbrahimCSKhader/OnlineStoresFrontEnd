import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useAuth from "../auth/useAuth.js";

export default function useSuperAdminStoreWorkspace(storeId) {
  const { platformToken } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.superAdmin.storeDetail(storeId), "workspace"],
    queryFn: () => storeApi.getStoreByIdWithAuth(storeId, platformToken),
    enabled: Boolean(storeId && platformToken),
  });
}
