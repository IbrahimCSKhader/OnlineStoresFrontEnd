import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useProductsByCategory(categoryId, options = {}) {
  const pricingScope = useProductPricingScope();
  const { params, language, ...queryOptions } = options;
  const queryParams = {
    ...(params || {}),
    ...(language ? { language } : {}),
  };

  return useQuery({
    queryKey: queryKeys.products.byCategory(categoryId, {
      ...queryParams,
      pricingScope,
    }),
    queryFn: () => productApi.getProductsByCategory(categoryId, queryParams),
    enabled: Boolean(categoryId) && (queryOptions.enabled ?? true),
    placeholderData: (previousData) => previousData,
    ...queryOptions,
  });
}
