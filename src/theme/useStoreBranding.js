import { useEffect } from "react";
import { useAppThemeVariant } from "./AppThemeProvider.jsx";

let activeStoreBrandingHooks = 0;
const defaultStoreThemeVariants = ["light", "dark", "nature"];
const pinkStoreThemeVariants = ["pink"];

function normalizeStoreThemeTemplate(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function resolveStoreThemeConfig(store) {
  const normalizedTemplate = normalizeStoreThemeTemplate(
    store?.themeTemplate ?? store?.ThemeTemplate,
  );

  switch (normalizedTemplate) {
    case "p":
    case "pink":
      return {
        defaultVariant: "pink",
        availableVariants: pinkStoreThemeVariants,
      };
    case "f":
    case "forest":
      return {
        defaultVariant: "nature",
        availableVariants: defaultStoreThemeVariants,
      };
    case "d":
    case "dark":
    case "darl":
      return {
        defaultVariant: "dark",
        availableVariants: defaultStoreThemeVariants,
      };
    case "l":
    case "light":
      return {
        defaultVariant: "light",
        availableVariants: defaultStoreThemeVariants,
      };
    default:
      return {
        defaultVariant: "light",
        availableVariants: defaultStoreThemeVariants,
      };
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

    const themeConfig = resolveStoreThemeConfig(store);

    setStoreDefaultVariant(
      themeConfig.defaultVariant,
      resolveStoreThemeKey(store),
      {
        availableVariants: themeConfig.availableVariants,
      },
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
