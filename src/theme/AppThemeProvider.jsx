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
const storeOnlyVariant = "pink";
const defaultAvailableVariants = THEME_VARIANTS.filter(
  (variant) => variant !== storeOnlyVariant,
);
const noop = () => {};

function resolveAllowedThemeVariants(values, fallback = defaultAvailableVariants) {
  const normalized = [...new Set(Array.isArray(values) ? values : [])].filter((value) =>
    THEME_VARIANTS.includes(value),
  );

  return normalized.length ? normalized : fallback;
}

function normalizeThemeVariant(
  value,
  fallback = null,
  allowedVariants = THEME_VARIANTS,
) {
  return resolveAllowedThemeVariants(allowedVariants, THEME_VARIANTS).includes(value)
    ? value
    : fallback;
}

function normalizeStoreThemeKey(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function resolveStoredThemeVariant() {
  return normalizeThemeVariant(
    getStorageItem(storageKeys.themeVariant, null),
    null,
    defaultAvailableVariants,
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
  availableVariants: defaultAvailableVariants,
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
    availableVariants: defaultAvailableVariants,
  });

  const scopedStoreKey = normalizeStoreThemeKey(storeThemeScope.storeKey);
  const scopedAvailableVariants = scopedStoreKey
    ? resolveAllowedThemeVariants(
        storeThemeScope.availableVariants,
        defaultAvailableVariants,
      )
    : defaultAvailableVariants;
  const scopedUserVariant = scopedStoreKey
    ? normalizeThemeVariant(
        storeThemeVariants[scopedStoreKey],
        null,
        scopedAvailableVariants,
      )
    : null;
  const resolvedGlobalUserVariant = normalizeThemeVariant(
    globalUserVariant,
    null,
    defaultAvailableVariants,
  );
  const variant = scopedStoreKey
    ? scopedUserVariant ??
      normalizeThemeVariant(
        storeThemeScope.defaultVariant,
        scopedAvailableVariants[0] ?? defaultVariant,
        scopedAvailableVariants,
      ) ??
      defaultVariant
    : resolvedGlobalUserVariant ?? defaultVariant;
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
      const normalizedVariant = scopedStoreKey
        ? normalizeThemeVariant(
            nextVariant,
            scopedAvailableVariants[0] ?? defaultVariant,
            scopedAvailableVariants,
          )
        : normalizeThemeVariant(
            nextVariant,
            defaultVariant,
            defaultAvailableVariants,
          );

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
    [persistStoreThemeVariants, scopedAvailableVariants, scopedStoreKey],
  );

  const setStoreDefaultVariant = useCallback((nextVariant, storeKey = "", options = {}) => {
    const normalizedStoreKey = normalizeStoreThemeKey(storeKey);
    const availableVariants = resolveAllowedThemeVariants(
      options.availableVariants,
      defaultAvailableVariants,
    );
    const normalizedVariant = normalizeThemeVariant(
      nextVariant,
      availableVariants[0] ?? defaultVariant,
      availableVariants,
    );

    setStoreThemeScope({
      storeKey: normalizedStoreKey,
      defaultVariant: normalizedVariant,
      availableVariants,
    });
  }, []);

  const clearStoreDefaultVariant = useCallback(() => {
    setStoreThemeScope({
      storeKey: "",
      defaultVariant,
      availableVariants: defaultAvailableVariants,
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
      hasStoredPreference: Boolean(
        scopedStoreKey ? scopedUserVariant : resolvedGlobalUserVariant,
      ),
      availableVariants: scopedStoreKey
        ? scopedAvailableVariants
        : defaultAvailableVariants,
      setStoreDefaultVariant,
      clearStoreDefaultVariant,
      setThemeBranding: noop,
      clearThemeBranding: noop,
    }),
    [
      clearStoreDefaultVariant,
      resolvedGlobalUserVariant,
      scopedAvailableVariants,
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
