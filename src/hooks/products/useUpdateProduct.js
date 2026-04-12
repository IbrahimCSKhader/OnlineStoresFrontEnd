import { useMutation, useQueryClient } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { syncProductFromResponse } from "./productCache.js";

export default function useUpdateProduct(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }) => productApi.updateProduct(productId, payload),
    ...options,
    onSuccess: (data, variables, context) => {
      const syncedProduct = syncProductFromResponse(queryClient, data, { storeId });
      const detailProductId = syncedProduct?.id || variables?.productId;

      if (detailProductId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(detailProductId),
        });
      }

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
