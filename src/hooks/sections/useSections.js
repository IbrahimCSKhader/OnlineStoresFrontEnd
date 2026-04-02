import { useQuery } from "@tanstack/react-query";
import sectionApi from "../../API/section.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useSections(storeId, options = {}) {
  return useQuery({
    queryKey: queryKeys.sections.byStore(storeId),
    queryFn: () => sectionApi.getSectionsByStore(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });
}
