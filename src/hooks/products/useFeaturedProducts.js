import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useFeaturedProducts(storeId, options = {}) {
  const pricingScope = useProductPricingScope();
  const { language, ...queryOptions } = options;
  const params = language ? { language } : undefined;

  return useQuery({
    queryKey: queryKeys.products.featured(storeId, {
      pricingScope,
      language: language || "",
    }),
    queryFn: () => productApi.getFeaturedProducts(storeId, params),
    enabled: Boolean(storeId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  });
}
