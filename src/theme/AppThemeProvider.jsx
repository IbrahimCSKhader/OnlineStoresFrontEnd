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
import { getStorageItem, setStorageItem, storageKeys } from "../utils/storage.js";

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

function resolveStoredThemeVariant() {
  return normalizeThemeVariant(
    getStorageItem(storageKeys.themeVariant, null),
    null,
  );
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
  const [userVariant, setUserVariant] = useState(() => resolveStoredThemeVariant());
  const [storeDefaultVariant, setStoreDefaultVariantState] = useState(
    defaultVariant,
  );

  const variant = userVariant ?? storeDefaultVariant ?? defaultVariant;
  const themeProfile = useMemo(() => buildThemeProfile(variant), [variant]);
  const theme = useMemo(() => createAppTheme(themeProfile), [themeProfile]);

  const setVariant = useCallback((nextVariant) => {
    const normalizedVariant = normalizeThemeVariant(nextVariant, defaultVariant);

    setUserVariant(normalizedVariant);
    setStorageItem(storageKeys.themeVariant, normalizedVariant);
  }, []);

  const setStoreDefaultVariant = useCallback((nextVariant) => {
    const normalizedVariant = normalizeThemeVariant(nextVariant, defaultVariant);
    setStoreDefaultVariantState(normalizedVariant);
  }, []);

  const clearStoreDefaultVariant = useCallback(() => {
    setStoreDefaultVariantState(defaultVariant);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = variant;
    document.documentElement.dataset.themeMode = themeProfile.mode;
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
    applyCssVariables(themeProfile.cssVars);
  }, [themeProfile, variant]);

  const contextValue = useMemo(
    () => ({
      variant,
      setVariant,
      themeProfile,
      hasStoredPreference: Boolean(userVariant),
      setStoreDefaultVariant,
      clearStoreDefaultVariant,
      setThemeBranding: noop,
      clearThemeBranding: noop,
    }),
    [
      clearStoreDefaultVariant,
      setStoreDefaultVariant,
      setVariant,
      themeProfile,
      userVariant,
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
