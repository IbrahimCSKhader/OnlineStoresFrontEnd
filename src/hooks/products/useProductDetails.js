import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useProductDetails(productId, options = {}) {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => productApi.getProductById(productId),
    enabled: Boolean(productId) && (options.enabled ?? true),
    ...options,
  });
}
