import { useQuery } from "@tanstack/react-query";
import categoryApi from "../../API/category.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCategories(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.categories.byStore(storeId),
    queryFn: () => categoryApi.getCategoriesByStore(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
