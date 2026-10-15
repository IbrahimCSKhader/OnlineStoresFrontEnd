import { useMemo } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { getCurrentCustomDomainHost } from "../../utils/customDomain.js";
import { translateStorefrontText } from "../../i18n/storefrontText.js";
import {
  DEFAULT_STOREFRONT_LANGUAGE,
  getStorefrontLanguage,
  normalizeStorefrontLanguage,
} from "../../i18n/storefrontLanguages.js";

export default function useStorefrontLanguage() {
  const location = useLocation();
  const route = matchPath("/market/:slug/*", location.pathname) ?? matchPath("/market/:slug", location.pathname);
  const slug = route?.params?.slug || "";
  const host = getCurrentCustomDomainHost();
  const scope = slug || host;
  const baseStoreQuery = useQuery({
    queryKey: ["storefront-language", scope],
    queryFn: () => slug ? storeApi.getStoreBySlug(slug) : storeApi.resolveStore({ host }),
    enabled: Boolean(scope),
    staleTime: 60000,
  });
  const baseStore = normalizeEntityResponse(baseStoreQuery.data);
  const language = scope
    ? normalizeStorefrontLanguage(baseStore?.language)
    : DEFAULT_STOREFRONT_LANGUAGE;
  const languageConfig = getStorefrontLanguage(language);

  return useMemo(
    () => ({
      language,
      languageConfig,
      copy: languageConfig.copy,
      dir: languageConfig.dir,
      locale: languageConfig.locale,
      t: (source, ...values) => translateStorefrontText(language, source, ...values),
      isLanguageLoading: Boolean(scope) && baseStoreQuery.isLoading,
    }),
    [language, languageConfig, scope, baseStoreQuery.isLoading],
  );
}
