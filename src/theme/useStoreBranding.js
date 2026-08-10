import { useEffect } from "react";
import { useAppThemeVariant } from "./AppThemeProvider.jsx";

let activeStoreBrandingHooks = 0;
const defaultStoreThemeVariants = ["light", "dark"];
const blueStoreThemeVariants = ["blue", "blue-dark"];
const greenStoreThemeVariants = ["nature", "nature-dark"];
const pinkStoreThemeVariants = ["pink", "pink-dark"];
const blackStoreThemeVariants = ["black", "black-light"];
const brownStoreThemeVariants = ["brown", "brown-dark"];
const purpleStoreThemeVariants = ["purple", "purple-dark"];
const goldStoreThemeVariants = ["gold", "gold-dark"];
const deepGreenStoreThemeVariants = ["deep-green", "deep-green-dark"];
const redStoreThemeVariants = ["red", "red-dark"];

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
    case "b":
    case "black":
      return {
        defaultVariant: "black",
        availableVariants: blackStoreThemeVariants,
      };
    case "g":
    case "f":
    case "forest":
    case "green":
      return {
        defaultVariant: "nature",
        availableVariants: greenStoreThemeVariants,
      };
    case "u":
    case "blue":
    case "azure":
      return {
        defaultVariant: "blue",
        availableVariants: blueStoreThemeVariants,
      };
    case "n":
    case "brown":
      return {
        defaultVariant: "brown",
        availableVariants: brownStoreThemeVariants,
      };
    case "v":
    case "purple":
      return {
        defaultVariant: "purple",
        availableVariants: purpleStoreThemeVariants,
      };
    case "y":
    case "gold":
    case "yellow":
      return {
        defaultVariant: "gold",
        availableVariants: goldStoreThemeVariants,
      };
    case "e":
    case "deep-green":
    case "dark-green":
      return {
        defaultVariant: "deep-green",
        availableVariants: deepGreenStoreThemeVariants,
      };
    case "r":
    case "red":
      return {
        defaultVariant: "red",
        availableVariants: redStoreThemeVariants,
      };
    case "dark":
    case "darl":
      return {
        defaultVariant: "dark",
        availableVariants: defaultStoreThemeVariants,
      };
    case "d":
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
