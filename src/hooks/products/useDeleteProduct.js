import { useMutation, useQueryClient } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { removeProductFromCaches } from "./productCache.js";

export default function useDeleteProduct(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.deleteProduct,
    ...options,
    onSuccess: (data, variables, context) => {
      removeProductFromCaches(queryClient, variables);

      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: ["products", "store", storeId],
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.featured(storeId) });
      }

      queryClient.invalidateQueries({ queryKey: ["products", "category"] });
      queryClient.invalidateQueries({ queryKey: ["products", "section"] });

      options.onSuccess?.(data, variables, context);
    },
  });
}
