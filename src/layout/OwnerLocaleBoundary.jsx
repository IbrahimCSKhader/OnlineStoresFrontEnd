import { useMemo } from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import useOwnerLanguage from "../hooks/storefront/useOwnerLanguage.js";

const ltrCache = createCache({ key: "ownerltr", prepend: true, stylisPlugins: [prefixer] });
const rtlCache = createCache({ key: "ownerrtl", prepend: true, stylisPlugins: [prefixer, rtlPlugin] });
export default function OwnerLocaleBoundary({ children }) {
  const { enabled, dir } = useOwnerLanguage();
  const parentTheme = useTheme();
  const theme = useMemo(() => createTheme(parentTheme, { direction: dir }), [parentTheme, dir]);
  if (!enabled) return children;
  return <CacheProvider value={dir === "ltr" ? ltrCache : rtlCache}><ThemeProvider theme={theme}>{children}</ThemeProvider></CacheProvider>;
}
