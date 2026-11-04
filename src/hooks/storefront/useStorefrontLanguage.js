import { useCallback, useMemo } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const client = useQueryClient();
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
  const selectionKey = ["storefront-language-selection", scope];
  const selection = useQuery({ queryKey: selectionKey, enabled: false, initialData: null });
  const canSwitchLanguage = Boolean(scope) && baseStore?.enableLanguageSwitching === true;
  const defaultLanguage = normalizeStorefrontLanguage(baseStore?.defaultLanguage ?? baseStore?.language);
  const updateLanguage = useCallback((value) => {
    if (canSwitchLanguage) {
      client.setQueryData(["storefront-language-selection", scope], normalizeStorefrontLanguage(value));
    }
  }, [canSwitchLanguage, client, scope]);
  const setLanguage = canSwitchLanguage ? updateLanguage : undefined;
  const language = canSwitchLanguage && selection.data
    ? normalizeStorefrontLanguage(selection.data)
    : scope
    ? defaultLanguage
    : DEFAULT_STOREFRONT_LANGUAGE;
  const languageConfig = getStorefrontLanguage(language);

  return useMemo(
    () => ({
      language,
      defaultLanguage,
      canSwitchLanguage,
      setLanguage,
      languageConfig,
      copy: languageConfig.copy,
      dir: languageConfig.dir,
      locale: languageConfig.locale,
      t: (source, ...values) => translateStorefrontText(language, source, ...values),
      isLanguageLoading: Boolean(scope) && baseStoreQuery.isLoading,
    }),
    [language, defaultLanguage, canSwitchLanguage, setLanguage, languageConfig, scope, baseStoreQuery.isLoading],
  );
}
