import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useProductDetails(productId, options = {}) {
  const pricingScope = useProductPricingScope();

  return useQuery({
    queryKey: queryKeys.products.detail(productId, pricingScope),
    queryFn: () => productApi.getProductById(productId),
    enabled: Boolean(productId) && (options.enabled ?? true),
    ...options,
  });
}
