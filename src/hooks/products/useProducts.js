import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useProducts(storeId, params, options = {}) {
  return useQuery({
    queryKey: queryKeys.products.byStore(storeId, params),
    queryFn: () => productApi.getProductsByStore(storeId, params),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
