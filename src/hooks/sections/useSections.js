import { useQuery } from "@tanstack/react-query";
import sectionApi from "../../API/section.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSections(storeId, options = {}) {
  const { language, ...queryOptions } = options;
  const params = language ? { language } : undefined;

  return useQuery({
    queryKey: [...queryKeys.sections.byStore(storeId), language || ""],
    queryFn: () => sectionApi.getSectionsByStore(storeId, params),
    enabled: Boolean(storeId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  });
}
