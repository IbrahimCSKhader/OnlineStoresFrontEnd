import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useProductsByCategory(categoryId, options = {}) {
  return useQuery({
    queryKey: queryKeys.products.byCategory(categoryId),
    queryFn: () => productApi.getProductsByCategory(categoryId),
    enabled: Boolean(categoryId) && (options.enabled ?? true),
    ...options,
  });
}
