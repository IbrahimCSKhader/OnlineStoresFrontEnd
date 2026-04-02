import { useMutation, useQueryClient } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useUpdateProduct(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }) => productApi.updateProduct(productId, payload),
    ...options,
    onSuccess: (data, variables, context) => {
      if (variables?.productId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      }

      if (storeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.byStore(storeId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.featured(storeId) });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
