import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useProductsBySection(sectionId, options = {}) {
  const pricingScope = useProductPricingScope();
  const { params, language, ...queryOptions } = options;
  const queryParams = {
    ...(params || {}),
    ...(language ? { language } : {}),
  };

  return useQuery({
    queryKey: queryKeys.products.bySection(sectionId, {
      ...queryParams,
      pricingScope,
    }),
    queryFn: () => productApi.getProductsBySection(sectionId, queryParams),
    enabled: Boolean(sectionId) && (queryOptions.enabled ?? true),
    placeholderData: (previousData) => previousData,
    ...queryOptions,
  });
}
