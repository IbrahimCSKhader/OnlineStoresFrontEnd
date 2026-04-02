import { useMutation, useQueryClient } from "@tanstack/react-query";
import customerStoreApi from "../../API/customerStore.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useDeleteCustomerStore(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerStoreApi.deleteCustomerStore,
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerStores.byStore(storeId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerStores.availableCustomers(storeId),
        });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
