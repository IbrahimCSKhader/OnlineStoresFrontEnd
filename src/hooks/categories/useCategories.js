import { useQuery } from "@tanstack/react-query";
import categoryApi from "../../API/category.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCategories(storeId, options = {}) {
  const { language, ...queryOptions } = options;
  const params = language ? { language } : undefined;

  return useQuery({
    queryKey: [...queryKeys.categories.byStore(storeId), language || ""],
    queryFn: () => categoryApi.getCategoriesByStore(storeId, params),
    enabled: Boolean(storeId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  });
}
