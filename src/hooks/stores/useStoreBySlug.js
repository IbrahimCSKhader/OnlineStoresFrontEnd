import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { getCurrentCustomDomainHost } from "../../utils/customDomain.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreBySlug(slug, options = {}) {
  const host = getCurrentCustomDomainHost();
  const normalizedSlug = String(slug || "").trim();
  const { enabled = true, language, ...queryOptions } = options;
  const languageParams = language ? { language } : undefined;

  return useQuery({
    queryKey: normalizedSlug
      ? [...queryKeys.stores.slug(normalizedSlug), language || ""]
      : [...queryKeys.stores.resolve(host), language || ""],
    queryFn: () =>
      normalizedSlug
        ? storeApi.getStoreBySlug(normalizedSlug, languageParams)
        : storeApi.resolveStore({ host, ...languageParams }),
    enabled: (Boolean(normalizedSlug) || Boolean(host)) && enabled,
    ...queryOptions,
  });
}
