import { useMutation, useQueryClient } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useDeleteVariant(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId }) => productApi.deleteVariant(variantId),
    ...options,
    onSuccess: (data, variables, context) => {
      if (variables?.productId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(variables.productId),
        });
      }

      if (storeId) {
        queryClient.invalidateQueries({ queryKey: ["products", "store", storeId] });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.featured(storeId) });
      }

      queryClient.invalidateQueries({ queryKey: ["products", "category"] });
      queryClient.invalidateQueries({ queryKey: ["products", "section"] });

      options.onSuccess?.(data, variables, context);
    },
  });
}
