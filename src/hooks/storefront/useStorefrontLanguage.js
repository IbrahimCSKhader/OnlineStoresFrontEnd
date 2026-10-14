import { useCallback, useMemo } from "react";
import { matchPath, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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

const STORAGE_KEY = "mawja.storefront.language";

function readStoredLanguage(scope) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(`${STORAGE_KEY}:${scope}`);
    return value ? normalizeStorefrontLanguage(value) : null;
  } catch {
    return null;
  }
}

export default function useStorefrontLanguage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
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
  const urlLanguage = searchParams.get("language") || searchParams.get("lang");
  const language = scope
    ? normalizeStorefrontLanguage(urlLanguage || readStoredLanguage(scope) || baseStore?.language)
    : DEFAULT_STOREFRONT_LANGUAGE;
  const languageConfig = getStorefrontLanguage(language);

  const setLanguage = useCallback(
    (nextLanguage) => {
      const normalizedLanguage = normalizeStorefrontLanguage(nextLanguage);

      if (typeof window !== "undefined") {
        try { window.localStorage.setItem(`${STORAGE_KEY}:${scope}`, normalizedLanguage); } catch { /* Storage may be unavailable. */ }
      }

      const nextSearchParams = new URLSearchParams(location.search);
      nextSearchParams.set("lang", normalizedLanguage);
      nextSearchParams.delete("language");

      navigate(
        {
          pathname: location.pathname,
          search: nextSearchParams.toString(),
          hash: location.hash,
        },
        { replace: true },
      );
    },
    [location.hash, location.pathname, location.search, navigate, scope],
  );

  return useMemo(
    () => ({
      language,
      languageConfig,
      copy: languageConfig.copy,
      dir: languageConfig.dir,
      locale: languageConfig.locale,
      setLanguage,
      t: (source, ...values) => translateStorefrontText(language, source, ...values),
      isLanguageLoading: Boolean(scope) && baseStoreQuery.isLoading && !urlLanguage && !readStoredLanguage(scope),
    }),
    [language, languageConfig, setLanguage, scope, baseStoreQuery.isLoading, urlLanguage],
  );
}
