import { useCallback, useContext, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import useAuth from "../auth/useAuth.js";
import useOwnerStore from "../stores/useOwnerStore.js";
import { isOwnerRole } from "../../utils/roles.js";
import { getStorefrontLanguage, normalizeStorefrontLanguage } from "../../i18n/storefrontLanguages.js";
import { translateOwnerText } from "../../i18n/ownerText.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatUiDateTime } from "../../utils/numberFormat.js";
import { OwnerLanguageContext } from "./OwnerLanguageContext.js";

const eventName = "mawja-owner-language-change";
function subscribe(callback) {
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(eventName, callback); window.removeEventListener("storage", callback); };
}

export default function useOwnerLanguage() {
  return useContext(OwnerLanguageContext);
}

export function useResolvedOwnerLanguage() {
  const { pathname } = useLocation();
  const { isPlatformAuthenticated, platformRole, platformUser } = useAuth();
  const enabled = isPlatformAuthenticated && isOwnerRole(platformRole) && /^\/owner(?:\/|$)/.test(pathname);
  const { ownerStore, isLoading: storeLoading } = useOwnerStore({ enabled });
  const key = `mawja.owner.language:${platformUser?.id || ""}:${ownerStore?.id || ""}`;
  const read = useCallback(() => {
    if (!enabled) return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  }, [key, enabled]);
  const preference = useSyncExternalStore(subscribe, read, () => null);
  const language = normalizeStorefrontLanguage(enabled ? preference || ownerStore?.language : "A");
  const config = getStorefrontLanguage(language);
  const setLanguage = useCallback(value => {
    if (!enabled || !ownerStore?.id) return;
    try { window.localStorage.setItem(key, normalizeStorefrontLanguage(value)); } catch { return; }
    window.dispatchEvent(new Event(eventName));
  }, [enabled, ownerStore?.id, key]);
  const t = useCallback(value => typeof value === "string" ? translateOwnerText(language, value) : value, [language]);
  const currency = useCallback(value => formatCurrency(value, { locale: config.locale }), [config.locale]);
  const dateTime = useCallback(value => formatUiDateTime(value, { locale: config.locale }), [config.locale]);
  return { ...config, language, t, currency, dateTime, setLanguage, enabled, isLoading: enabled && Boolean(storeLoading) };
}
