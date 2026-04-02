import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreDetails(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.stores.detail(storeId),
    queryFn: () => storeApi.getStoreById(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
