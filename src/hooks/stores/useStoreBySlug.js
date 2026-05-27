import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { getCurrentCustomDomainHost } from "../../utils/customDomain.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreBySlug(slug, options = {}) {
  const host = getCurrentCustomDomainHost();
  const normalizedSlug = String(slug || "").trim();
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: normalizedSlug
      ? queryKeys.stores.slug(normalizedSlug)
      : queryKeys.stores.resolve(host),
    queryFn: () =>
      normalizedSlug
        ? storeApi.getStoreBySlug(normalizedSlug)
        : storeApi.resolveStore({ host }),
    enabled: (Boolean(normalizedSlug) || Boolean(host)) && enabled,
    ...queryOptions,
  });
}
