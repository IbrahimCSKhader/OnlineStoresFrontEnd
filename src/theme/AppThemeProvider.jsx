/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
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

const ThemeVariantContext = createContext({
  variant: defaultVariant,
  setVariant: noop,
  themeProfile: buildThemeProfile(defaultVariant),
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
  const [variant, setVariant] = useState(() => {
    const storedVariant = getStorageItem(storageKeys.themeVariant, defaultVariant);

    return THEME_VARIANTS.includes(storedVariant)
      ? storedVariant
      : defaultVariant;
  });
  const setThemeBranding = noop;
  const clearThemeBranding = noop;

  const themeProfile = useMemo(() => buildThemeProfile(variant), [variant]);
  const theme = useMemo(() => createAppTheme(themeProfile), [themeProfile]);

  useEffect(() => {
    document.documentElement.dataset.theme = variant;
    document.documentElement.dataset.themeMode = themeProfile.mode;
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
    setStorageItem(storageKeys.themeVariant, variant);
    applyCssVariables(themeProfile.cssVars);
  }, [themeProfile, variant]);

  const contextValue = useMemo(
    () => ({
      variant,
      setVariant,
      themeProfile,
      setThemeBranding,
      clearThemeBranding,
    }),
    [clearThemeBranding, setThemeBranding, themeProfile, variant],
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
