import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreSubscription(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.stores.subscription(storeId),
    queryFn: () => storeApi.getStoreSubscription(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
