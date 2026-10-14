import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  DEFAULT_STOREFRONT_LANGUAGE,
  getStorefrontLanguage,
  normalizeStorefrontLanguage,
} from "../../i18n/storefrontLanguages.js";

const STORAGE_KEY = "mawja.storefront.language";

function readStoredLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_STOREFRONT_LANGUAGE;
  }

  return normalizeStorefrontLanguage(window.localStorage.getItem(STORAGE_KEY));
}

export default function useStorefrontLanguage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const urlLanguage = searchParams.get("language") || searchParams.get("lang");
  const language = normalizeStorefrontLanguage(urlLanguage || readStoredLanguage());
  const languageConfig = getStorefrontLanguage(language);

  const setLanguage = useCallback(
    (nextLanguage) => {
      const normalizedLanguage = normalizeStorefrontLanguage(nextLanguage);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, normalizedLanguage);
      }

      const nextSearchParams = new URLSearchParams(location.search);
      if (normalizedLanguage === DEFAULT_STOREFRONT_LANGUAGE) {
        nextSearchParams.delete("lang");
        nextSearchParams.delete("language");
      } else {
        nextSearchParams.set("lang", normalizedLanguage);
        nextSearchParams.delete("language");
      }

      navigate(
        {
          pathname: location.pathname,
          search: nextSearchParams.toString(),
          hash: location.hash,
        },
        { replace: true },
      );
    },
    [location.hash, location.pathname, location.search, navigate],
  );

  return useMemo(
    () => ({
      language,
      languageConfig,
      copy: languageConfig.copy,
      dir: languageConfig.dir,
      locale: languageConfig.locale,
      setLanguage,
    }),
    [language, languageConfig, setLanguage],
  );
}
