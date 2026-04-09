import { useEffect } from "react";
import { useAppThemeVariant } from "./AppThemeProvider.jsx";

let activeStoreBrandingHooks = 0;

function normalizeStoreThemeTemplate(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function resolveStoreThemeVariant(store) {
  const normalizedTemplate = normalizeStoreThemeTemplate(
    store?.themeTemplate ?? store?.ThemeTemplate,
  );

  switch (normalizedTemplate) {
    case "f":
    case "forest":
      return "nature";
    case "d":
    case "dark":
    case "darl":
      return "dark";
    case "l":
    case "light":
      return "light";
    default:
      return "light";
  }
}

function resolveStoreThemeKey(store) {
  return String(store?.id ?? store?.storeId ?? store?.StoreId ?? "").trim();
}

export default function useStoreBranding(store) {
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
      return;
    }

    setStoreDefaultVariant(
      resolveStoreThemeVariant(store),
      resolveStoreThemeKey(store),
    );
  }, [
    setStoreDefaultVariant,
    store,
    store?.id,
    store?.storeId,
    store?.StoreId,
    store?.ThemeTemplate,
    store?.themeTemplate,
  ]);

  return null;
}
