import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useProductsBySection(sectionId, options = {}) {
  const pricingScope = useProductPricingScope();

  return useQuery({
    queryKey: queryKeys.products.bySection(sectionId, pricingScope),
    queryFn: () => productApi.getProductsBySection(sectionId),
    enabled: Boolean(sectionId) && (options.enabled ?? true),
    ...options,
  });
}
