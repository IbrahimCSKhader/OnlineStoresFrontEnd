const DEFAULT_PLATFORM_HOSTS = [
  "localhost",
  "127.0.0.1",
  "::1",
  "mawja.site",
  "www.mawja.site",
  "mawja.com",
  "www.mawja.com",
  "mawja.premiumasp.net",
];

function normalizeHost(value = "") {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  const candidate = rawValue.includes("://") ? rawValue : `https://${rawValue}`;

  try {
    const host = new URL(candidate).hostname.trim().toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return rawValue
      .split("/")[0]
      .split(":")[0]
      .trim()
      .toLowerCase()
      .replace(/^www\./, "");
  }
}

function getConfiguredPlatformHosts() {
  const apiHost = normalizeHost(import.meta.env.VITE_API_BASE_URL || "");
  const frontendHost = normalizeHost(import.meta.env.VITE_FRONTEND_BASE_URL || "");
  const extraHosts = String(import.meta.env.VITE_PLATFORM_HOSTS || "")
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);

  return new Set(
    [...DEFAULT_PLATFORM_HOSTS.map(normalizeHost), apiHost, frontendHost, ...extraHosts]
      .filter(Boolean),
  );
}

function isLocalDevelopmentHost(host) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)
  );
}

export function getCurrentHost() {
  if (typeof window === "undefined") {
    return "";
  }

  return normalizeHost(window.location.hostname);
}

export function isPlatformHost(host = "") {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost) {
    return true;
  }

  return getConfiguredPlatformHosts().has(normalizedHost) ||
    isLocalDevelopmentHost(normalizedHost);
}

export function getCurrentCustomDomainHost() {
  const host = getCurrentHost();
  return host && !isPlatformHost(host) ? host : "";
}

export function isCustomDomainStorefront() {
  return Boolean(getCurrentCustomDomainHost());
}

export function buildStorefrontPath(slug = "", path = "") {
  const normalizedPath = path
    ? `/${String(path).replace(/^\/+/, "")}`
    : "";

  if (isCustomDomainStorefront()) {
    return normalizedPath || "/";
  }

  const normalizedSlug = String(slug || "").trim();
  return normalizedSlug ? `/market/${normalizedSlug}${normalizedPath}` : normalizedPath || "/";
}

export function normalizeStorefrontPath(pathname = "") {
  const rawPath = String(pathname || "").trim() || "/";

  if (!isCustomDomainStorefront()) {
    return rawPath;
  }

  const match = rawPath.match(/^\/market\/[^/?#]+(\/[^?#]*)?([?#].*)?$/i);

  if (!match) {
    return rawPath;
  }

  return `${match[1] || "/"}${match[2] || ""}`;
}
