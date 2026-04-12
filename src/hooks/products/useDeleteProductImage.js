import { useMutation, useQueryClient } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { syncProductFromResponse } from "./productCache.js";

export default function useDeleteProductImage(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId }) => productApi.deleteProductImage(imageId),
    ...options,
    onSuccess: (data, variables, context) => {
      const productId = variables?.productId;
      const syncedProduct = syncProductFromResponse(queryClient, data, { storeId });
      const detailProductId = syncedProduct?.id || productId;

      if (detailProductId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(detailProductId),
        });
      }

      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: ["products", "store", storeId],
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.featured(storeId),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["products", "category"] });
      queryClient.invalidateQueries({ queryKey: ["products", "section"] });

      options.onSuccess?.(data, variables, context);
    },
  });
}
