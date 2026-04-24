import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useFeaturedProducts(storeId, options = {}) {
  const pricingScope = useProductPricingScope();

  return useQuery({
    queryKey: queryKeys.products.featured(storeId, pricingScope),
    queryFn: () => productApi.getFeaturedProducts(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
