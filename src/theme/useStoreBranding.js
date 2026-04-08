import { useEffect } from "react";
import { useAppThemeVariant } from "./AppThemeProvider.jsx";

let activeStoreBrandingHooks = 0;
let lastAppliedStoreThemeSignature = "";

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

function buildStoreThemeSignature(store) {
  const storeKey =
    store?.id ?? store?.slug ?? store?.name ?? store?.storeId ?? "store";
  const normalizedTemplate = normalizeStoreThemeTemplate(
    store?.themeTemplate ?? store?.ThemeTemplate,
  );

  return `${storeKey}:${normalizedTemplate || "light"}`;
}

export default function useStoreBranding(store) {
  const { setVariant } = useAppThemeVariant();

  useEffect(() => {
    activeStoreBrandingHooks += 1;

    return () => {
      activeStoreBrandingHooks = Math.max(0, activeStoreBrandingHooks - 1);

      if (activeStoreBrandingHooks === 0) {
        lastAppliedStoreThemeSignature = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!store || typeof store !== "object") {
      return;
    }

    const nextSignature = buildStoreThemeSignature(store);

    if (lastAppliedStoreThemeSignature === nextSignature) {
      return;
    }

    lastAppliedStoreThemeSignature = nextSignature;
    setVariant(resolveStoreThemeVariant(store));
  }, [
    setVariant,
    store,
    store?.ThemeTemplate,
    store?.id,
    store?.name,
    store?.slug,
    store?.storeId,
    store?.themeTemplate,
  ]);

  return null;
}
