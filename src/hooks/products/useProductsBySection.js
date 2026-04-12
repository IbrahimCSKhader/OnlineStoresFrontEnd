import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useProductsBySection(sectionId, options = {}) {
  return useQuery({
    queryKey: queryKeys.products.bySection(sectionId),
    queryFn: () => productApi.getProductsBySection(sectionId),
    enabled: Boolean(sectionId) && (options.enabled ?? true),
    ...options,
  });
}
