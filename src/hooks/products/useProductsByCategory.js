import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useProductsByCategory(categoryId, options = {}) {
  const pricingScope = useProductPricingScope();
  const { params, ...queryOptions } = options;

  return useQuery({
    queryKey: queryKeys.products.byCategory(categoryId, {
      ...(params || {}),
      pricingScope,
    }),
    queryFn: () => productApi.getProductsByCategory(categoryId, params),
    enabled: Boolean(categoryId) && (queryOptions.enabled ?? true),
    placeholderData: (previousData) => previousData,
    ...queryOptions,
  });
}
