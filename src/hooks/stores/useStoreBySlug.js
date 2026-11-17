import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { getCurrentCustomDomainHost } from "../../utils/customDomain.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreBySlug(slug, options = {}) {
  const host = getCurrentCustomDomainHost();
  const normalizedSlug = String(slug || "").trim();
  const { enabled = true, language, ...queryOptions } = options;
  const languageParams = language ? { language } : undefined;
  const storeKey = normalizedSlug
    ? queryKeys.stores.slug(normalizedSlug)
    : queryKeys.stores.resolve(host);

  return useQuery({
    queryKey: [...storeKey, language || ""],
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey.length === storeKey.length + 1 &&
      storeKey.every((part, index) => previousQuery.queryKey[index] === part)
        ? previousData
        : undefined,
    queryFn: () =>
      normalizedSlug
        ? storeApi.getStoreBySlug(normalizedSlug, languageParams)
        : storeApi.resolveStore({ host, ...languageParams }),
    enabled: (Boolean(normalizedSlug) || Boolean(host)) && enabled,
    ...queryOptions,
  });
}
