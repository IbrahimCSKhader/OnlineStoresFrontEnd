import { useEffect } from "react";
import { useAppThemeVariant } from "./AppThemeProvider.jsx";
import { resolveStoreThemeConfig } from "./storeThemeConfig.js";

let activeStoreBrandingHooks = 0;

function resolveStoreThemeKey(store) {
  return String(store?.id ?? store?.storeId ?? store?.StoreId ?? "").trim();
}

export default function useStoreBranding(store, { appearanceEnabled = true } = {}) {
  const { setStoreDefaultVariant, clearStoreDefaultVariant } =
    useAppThemeVariant();

  useEffect(() => {
    activeStoreBrandingHooks += 1;

    return () => {
      activeStoreBrandingHooks = Math.max(0, activeStoreBrandingHooks - 1);

      if (activeStoreBrandingHooks === 0) {
        clearStoreDefaultVariant();
      }
    };
  }, [clearStoreDefaultVariant]);

  useEffect(() => {
    if (!store || typeof store !== "object") {
      clearStoreDefaultVariant();
      return;
    }

    const themeConfig = resolveStoreThemeConfig(store);

    setStoreDefaultVariant(
      themeConfig.defaultVariant,
      resolveStoreThemeKey(store),
      {
        availableVariants: themeConfig.availableVariants,
        appearance: appearanceEnabled ? store.appearance ?? null : null,
      },
    );
  }, [
    appearanceEnabled,
    setStoreDefaultVariant,
    clearStoreDefaultVariant,
    store,
    store?.id,
    store?.storeId,
    store?.StoreId,
    store?.ThemeTemplate,
    store?.themeTemplate,
  ]);

  return null;
}
