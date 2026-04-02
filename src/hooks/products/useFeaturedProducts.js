import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useFeaturedProducts(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.products.featured(storeId),
    queryFn: () => productApi.getFeaturedProducts(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
