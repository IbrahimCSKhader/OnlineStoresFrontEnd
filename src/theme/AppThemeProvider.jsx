/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { buildThemeProfile, createAppTheme, THEME_VARIANTS } from "./themes.js";
import {
  getStorageItem,
  getStorageJson,
  removeStorageItem,
  setStorageItem,
  setStorageJson,
  storageKeys,
} from "../utils/storage.js";

const cacheLtr = createCache({
  key: "muirtl",
  prepend: true,
  stylisPlugins: [prefixer, rtlPlugin],
});

const defaultVariant = "light";
const noop = () => {};

function normalizeThemeVariant(value, fallback = null) {
  return THEME_VARIANTS.includes(value) ? value : fallback;
}

function normalizeStoreThemeKey(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function resolveStoredThemeVariant() {
  return normalizeThemeVariant(
    getStorageItem(storageKeys.themeVariant, null),
    null,
  );
}

function resolveStoredStoreThemeVariants() {
  const storedValue = getStorageJson(storageKeys.storeThemeVariants, {});
  return storedValue && typeof storedValue === "object" ? storedValue : {};
}

const ThemeVariantContext = createContext({
  variant: defaultVariant,
  setVariant: noop,
  themeProfile: buildThemeProfile(defaultVariant),
  hasStoredPreference: false,
  setStoreDefaultVariant: noop,
  clearStoreDefaultVariant: noop,
  setThemeBranding: noop,
  clearThemeBranding: noop,
});

function applyCssVariables(cssVars) {
  if (typeof document === "undefined") {
    return;
  }

  Object.entries(cssVars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

export function useAppThemeVariant() {
  return useContext(ThemeVariantContext);
}

export default function AppThemeProvider({ children }) {
  const [globalUserVariant, setGlobalUserVariant] = useState(() => resolveStoredThemeVariant());
  const [storeThemeVariants, setStoreThemeVariants] = useState(() =>
    resolveStoredStoreThemeVariants(),
  );
  const [storeThemeScope, setStoreThemeScope] = useState({
    storeKey: "",
    defaultVariant,
  });

  const scopedStoreKey = normalizeStoreThemeKey(storeThemeScope.storeKey);
  const scopedUserVariant = scopedStoreKey
    ? normalizeThemeVariant(storeThemeVariants[scopedStoreKey], null)
    : null;
  const variant = scopedStoreKey
    ? scopedUserVariant ?? storeThemeScope.defaultVariant ?? defaultVariant
    : globalUserVariant ?? defaultVariant;
  const themeProfile = useMemo(() => buildThemeProfile(variant), [variant]);
  const theme = useMemo(() => createAppTheme(themeProfile), [themeProfile]);

  const persistStoreThemeVariants = useCallback((nextState) => {
    const entries = Object.entries(nextState || {}).filter(([, value]) =>
      normalizeThemeVariant(value, null),
    );

    if (!entries.length) {
      removeStorageItem(storageKeys.storeThemeVariants);
      return;
    }

    setStorageJson(storageKeys.storeThemeVariants, Object.fromEntries(entries));
  }, []);

  const setVariant = useCallback(
    (nextVariant) => {
      const normalizedVariant = normalizeThemeVariant(nextVariant, defaultVariant);

      if (scopedStoreKey) {
        setStoreThemeVariants((current) => {
          const nextState = {
            ...current,
            [scopedStoreKey]: normalizedVariant,
          };

          persistStoreThemeVariants(nextState);
          return nextState;
        });
        return;
      }

      setGlobalUserVariant(normalizedVariant);
      setStorageItem(storageKeys.themeVariant, normalizedVariant);
    },
    [persistStoreThemeVariants, scopedStoreKey],
  );

  const setStoreDefaultVariant = useCallback((nextVariant, storeKey = "") => {
    const normalizedVariant = normalizeThemeVariant(nextVariant, defaultVariant);
    const normalizedStoreKey = normalizeStoreThemeKey(storeKey);

    setStoreThemeScope({
      storeKey: normalizedStoreKey,
      defaultVariant: normalizedVariant,
    });
  }, []);

  const clearStoreDefaultVariant = useCallback(() => {
    setStoreThemeScope({
      storeKey: "",
      defaultVariant,
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = variant;
    document.documentElement.dataset.themeMode = themeProfile.mode;
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar-u-nu-latn";
    applyCssVariables(themeProfile.cssVars);
  }, [themeProfile, variant]);

  const contextValue = useMemo(
    () => ({
      variant,
      setVariant,
      themeProfile,
      hasStoredPreference: Boolean(scopedStoreKey ? scopedUserVariant : globalUserVariant),
      setStoreDefaultVariant,
      clearStoreDefaultVariant,
      setThemeBranding: noop,
      clearThemeBranding: noop,
    }),
    [
      clearStoreDefaultVariant,
      globalUserVariant,
      scopedStoreKey,
      scopedUserVariant,
      setStoreDefaultVariant,
      setVariant,
      themeProfile,
      variant,
    ],
  );

  return (
    <CacheProvider value={cacheLtr}>
      <ThemeVariantContext.Provider value={contextValue}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeVariantContext.Provider>
    </CacheProvider>
  );
}
