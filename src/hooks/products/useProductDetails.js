import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useProductDetails(productId, options = {}) {
  const pricingScope = useProductPricingScope();
  const { language, ...queryOptions } = options;
  const params = language ? { language } : undefined;

  return useQuery({
    queryKey: queryKeys.products.detail(productId, {
      pricingScope,
      language: language || "",
    }),
    queryFn: () => productApi.getProductById(productId, params),
    enabled: Boolean(productId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  });
}
