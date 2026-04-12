import { useMutation, useQueryClient } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { syncProductFromResponse } from "./productCache.js";

export default function useCreateProduct(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.createProduct,
    ...options,
    onSuccess: (data, variables, context) => {
      syncProductFromResponse(queryClient, data, { storeId });

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
