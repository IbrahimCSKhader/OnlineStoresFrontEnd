import { translateStorefrontText } from "./storefrontText.js";
import translations from "./ownerTranslations.json";

export function translateOwnerText(language, source) {
  if (language === "A" || typeof source !== "string") return source;
  const trimmed = source.trim();
  const value = translations[trimmed]?.[language];
  return value ? source.replace(trimmed, value) : translateStorefrontText(language, source);
}
