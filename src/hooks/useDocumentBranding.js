import { useEffect } from "react";
import {
  SITE_BRAND_ASSET_PATH,
  SITE_BRAND_NAME,
} from "../constants/siteBranding.js";

function resolveFaviconType(iconHref) {
  if (/\.png($|\?)/i.test(iconHref)) {
    return "image/png";
  }

  if (/\.jpe?g($|\?)/i.test(iconHref)) {
    return "image/jpeg";
  }

  if (/\.svg($|\?)/i.test(iconHref)) {
    return "image/svg+xml";
  }

  return "";
}

function ensureFaviconLink() {
  const existingLink =
    document.querySelector("link[rel='icon']") ||
    document.querySelector("link[rel~='icon']");

  if (existingLink) {
    return existingLink;
  }

  const link = document.createElement("link");
  link.rel = "icon";
  document.head.appendChild(link);
  return link;
}

export default function useDocumentBranding({
  title = SITE_BRAND_NAME,
  iconHref = SITE_BRAND_ASSET_PATH,
} = {}) {
  useEffect(() => {
    const resolvedTitle =
      String(title || SITE_BRAND_NAME).trim() || SITE_BRAND_NAME;
    const resolvedIcon =
      String(iconHref || SITE_BRAND_ASSET_PATH).trim() ||
      SITE_BRAND_ASSET_PATH;
    const faviconLink = ensureFaviconLink();
    const faviconType = resolveFaviconType(resolvedIcon);

    document.title = resolvedTitle;
    faviconLink.setAttribute("href", resolvedIcon);

    if (faviconType) {
      faviconLink.setAttribute("type", faviconType);
      return;
    }

    faviconLink.removeAttribute("type");
  }, [iconHref, title]);
}
