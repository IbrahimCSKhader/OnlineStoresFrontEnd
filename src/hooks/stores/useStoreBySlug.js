import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreBySlug(slug, options = {}) {
  return useQuery({
    queryKey: queryKeys.stores.slug(slug),
    queryFn: () => storeApi.getStoreBySlug(slug),
    enabled: Boolean(slug) && (options.enabled ?? true),
    ...options,
  });
}
