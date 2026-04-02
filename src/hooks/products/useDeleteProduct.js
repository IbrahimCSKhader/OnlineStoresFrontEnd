import { useMutation, useQueryClient } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useDeleteProduct(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.deleteProduct,
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.byStore(storeId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.featured(storeId) });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
