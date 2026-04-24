import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useProductsByCategory(categoryId, options = {}) {
  const pricingScope = useProductPricingScope();

  return useQuery({
    queryKey: queryKeys.products.byCategory(categoryId, pricingScope),
    queryFn: () => productApi.getProductsByCategory(categoryId),
    enabled: Boolean(categoryId) && (options.enabled ?? true),
    ...options,
  });
}
