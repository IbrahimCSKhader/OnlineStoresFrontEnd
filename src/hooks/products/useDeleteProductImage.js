import { useMutation, useQueryClient } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useDeleteProductImage(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId }) => productApi.deleteProductImage(imageId),
    ...options,
    onSuccess: (data, variables, context) => {
      const productId = variables?.productId;

      if (productId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(productId),
        });
      }

      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.byStore(storeId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.featured(storeId),
        });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
