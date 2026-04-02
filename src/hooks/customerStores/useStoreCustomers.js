import { useQuery } from "@tanstack/react-query";
import customerStoreApi from "../../API/customerStore.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreCustomers(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.customerStores.byStore(storeId),
    queryFn: () => customerStoreApi.getStoreCustomers(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
