import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { isCustomDomainStorefront } from "../utils/customDomain.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://mawja.premiumasp.net";
const PUBLIC_PAGE = /^(?:products|about|contact|offers|(?:product|category|offers)\/[^/]+)?\/?$/;
const PUBLIC_QUERY = new Set(["search", "q", "page", "category", "sort", "language", "lang"]);

export function storeManifestUrl({ slug, pathname, search = "", hash = "", origin, customDomain = false, apiBase = API_BASE }) {
  if (!slug) return "";
  const base = customDomain ? "/" : `/market/${encodeURIComponent(slug)}`;
  if (!customDomain && pathname !== base && !pathname.startsWith(`${base}/`)) return "";
  const page = customDomain ? pathname.slice(1) : pathname.slice(base.length).replace(/^\//, "");
  if (!PUBLIC_PAGE.test(page)) return "";
  if ([...new URLSearchParams(search).keys()].some(key => !PUBLIC_QUERY.has(key.toLowerCase()))) return "";
  const endpoint = new URL(`api/store-install/${encodeURIComponent(slug)}/manifest.webmanifest`, `${apiBase.replace(/\/+$/, "")}/`);
  endpoint.searchParams.set("url", `${origin}${pathname}${search}${hash}`);
  return endpoint.href;
}

export default function useStoreInstallManifest(slug) {
  const { pathname, search, hash } = useLocation();
  useLayoutEffect(() => {
    const href = storeManifestUrl({ slug, pathname, search, hash, origin: window.location.origin, customDomain: isCustomDomainStorefront() });
    // Save/restore a platform manifest if a deployment adds one. Never overwrite it.
    const previous = [...document.querySelectorAll('link[rel="manifest"]')];
    previous.forEach(link => link.remove());
    let link;
    if (href) {
      link = document.createElement("link");
      link.rel = "manifest";
      link.crossOrigin = "anonymous";
      link.href = href;
      document.head.appendChild(link);
    }
    return () => {
      link?.remove();
      previous.forEach(item => document.head.appendChild(item));
    };
  }, [slug, pathname, search, hash]);
}
