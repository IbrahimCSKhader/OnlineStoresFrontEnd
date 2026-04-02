import { useQuery } from "@tanstack/react-query";
import customerStoreApi from "../../API/customerStore.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useAvailableCustomers(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.customerStores.availableCustomers(storeId),
    queryFn: () => customerStoreApi.getAvailableCustomers(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
