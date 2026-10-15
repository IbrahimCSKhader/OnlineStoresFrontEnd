import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useHighlightProducts(storeId, language) {
  const pricingScope = useProductPricingScope();
  return useQuery({
    queryKey: ["products", "highlights", storeId, { language, pricingScope }],
    queryFn: () => productApi.getHighlightProducts(storeId, { language }),
    enabled: Boolean(storeId),
    staleTime: 30000,
  });
}
