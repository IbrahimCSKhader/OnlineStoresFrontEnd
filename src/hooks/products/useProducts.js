import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useProducts(storeId, params, options = {}) {
  const { management = false, ...queryOptions } = options;
  const queryParams = management
    ? { ...(params || {}), scope: "manage" }
    : params || {};

  return useQuery({
    queryKey: queryKeys.products.byStore(storeId, queryParams),
    queryFn: () =>
      management
        ? productApi.getManagedProductsByStore(storeId, params)
        : productApi.getProductsByStore(storeId, params),
    enabled: Boolean(storeId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  });
}
