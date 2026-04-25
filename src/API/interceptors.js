import {
  clearPlatformAuthSession,
  clearStorefrontAuthSession,
  getPlatformAuthToken,
  doesStorefrontSessionMatchScope,
  findStorefrontAuthSessionInCollection,
  normalizeStoreScope,
  normalizeStorefrontAuthSession,
} from "../utils/token.js";
import useAuthStore from "../store/authStore.js";

const PUBLIC_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-email",
  "/api/auth/resend-verification-code",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/google",
  "/api/auth/google-callback",
  "/api/store-customer-auth/login",
  "/api/store-customer-auth/google",
  "/api/store-customer-auth/google-callback",
  "/api/store-customer-auth/register",
  "/api/store-customer-auth/verify-email",
  "/api/store-customer-auth/resend-verification-code",
  "/api/store-customer-auth/forgot-password",
  "/api/store-customer-auth/reset-password",
];

function getRequestUrl(config) {
  return String(config?.url || "");
}

function getRequestMethod(config) {
  return String(config?.method || "get").toLowerCase();
}

function normalizePathname(configOrUrl) {
  const rawUrl =
    typeof configOrUrl === "string" ? configOrUrl : getRequestUrl(configOrUrl);
  const withoutOrigin = rawUrl.replace(/^[a-z]+:\/\/[^/]+/i, "");
  const [pathname = ""] = withoutOrigin.split(/[?#]/);

  return pathname.toLowerCase();
}

function isPublicAuthRequest(configOrUrl) {
  const pathname = normalizePathname(configOrUrl);

  if (
    /^\/api\/store-customer-auth\/store\/[^/]+\/login$/.test(pathname)
  ) {
    return true;
  }

  return PUBLIC_AUTH_PATHS.includes(pathname);
}

function isOptionalStorefrontCatalogPath(pathname, method) {
  return method === "get" && /^\/api\/product\/store\/[^/]+$/.test(pathname);
}

function isStorefrontProtectedPath(pathname, method) {
  if (pathname.startsWith("/api/cart/") || pathname === "/api/cart/add") {
    return true;
  }

  if (pathname === "/api/order" && method === "post") {
    return true;
  }

  if (pathname.startsWith("/api/order/my-orders")) {
    return true;
  }

  if (pathname === "/api/store-customer-auth/set-password") {
    return true;
  }

  if (/^\/api\/review\/product\/[^/]+\/my-review$/.test(pathname)) {
    return true;
  }

  if (pathname === "/api/review" && method === "post") {
    return true;
  }

  if (/^\/api\/review\/[^/]+$/.test(pathname) && ["put", "delete"].includes(method)) {
    return true;
  }

  return false;
}

function isPlatformProtectedStorePath(pathname, method) {
  if (pathname === "/api/store/owned" && method === "get") {
    return true;
  }

  if (pathname === "/api/store" && method === "post") {
    return true;
  }

  if (/^\/api\/store\/[^/]+\/subscription$/.test(pathname)) {
    return true;
  }

  return /^\/api\/store\/[^/]+$/.test(pathname) && ["put", "delete"].includes(method);
}

function isPlatformProtectedCategoryPath(pathname, method) {
  return pathname === "/api/category" && ["post"].includes(method)
    ? true
    : /^\/api\/category\/[^/]+$/.test(pathname) && ["put", "delete"].includes(method);
}

function isPlatformProtectedSectionPath(pathname, method) {
  return pathname === "/api/section" && ["post"].includes(method)
    ? true
    : /^\/api\/section\/[^/]+$/.test(pathname) && ["put", "delete"].includes(method);
}

function isPlatformProtectedProductPath(pathname, method) {
  if (pathname === "/api/product" && method === "post") {
    return true;
  }

  if (pathname === "/api/product/image" && method === "post") {
    return true;
  }

  if (/^\/api\/product\/image\/[^/]+$/.test(pathname) && method === "delete") {
    return true;
  }

  if (/^\/api\/product\/variant\/[^/]+$/.test(pathname) && method === "delete") {
    return true;
  }

  if (/^\/api\/product\/[^/]+\/variant$/.test(pathname) && method === "post") {
    return true;
  }

  return /^\/api\/product\/[^/]+$/.test(pathname) && ["put", "delete"].includes(method);
}

function isPlatformProtectedOfferPath(pathname, method) {
  if (pathname === "/api/offer" && method === "post") {
    return true;
  }

  return /^\/api\/offer\/[^/]+$/.test(pathname) && ["put", "delete"].includes(method);
}

function isPlatformProtectedOrderPath(pathname, method) {
  return (
    pathname.startsWith("/api/order/store/") ||
    (/^\/api\/order\/[^/]+\/status$/.test(pathname) && method === "put")
  );
}

function isPlatformProtectedReviewPath(pathname, method) {
  return (
    pathname.startsWith("/api/review/store/") ||
    (/^\/api\/review\/[^/]+\/approval$/.test(pathname) && method === "put")
  );
}

function isPlatformProtectedEmailPath(pathname) {
  return pathname.startsWith("/api/email/") && pathname !== "/api/email/public-send";
}

function isPlatformProtectedPath(pathname, method) {
  if (pathname.startsWith("/api/auth/")) {
    return !isPublicAuthRequest(pathname);
  }

  if (pathname.startsWith("/api/coupon")) {
    return true;
  }

  if (pathname.startsWith("/api/customerstore")) {
    return true;
  }

  if (pathname.startsWith("/api/subscription-plans")) {
    return true;
  }

  if (pathname.startsWith("/api/subscriptions")) {
    return true;
  }

  if (pathname.startsWith("/api/store-subscriptions")) {
    return true;
  }

  if (pathname.startsWith("/api/super-admin-dashboard")) {
    return true;
  }

  if (isPlatformProtectedStorePath(pathname, method)) {
    return true;
  }

  if (isPlatformProtectedCategoryPath(pathname, method)) {
    return true;
  }

  if (isPlatformProtectedSectionPath(pathname, method)) {
    return true;
  }

  if (isPlatformProtectedProductPath(pathname, method)) {
    return true;
  }

  if (isPlatformProtectedOfferPath(pathname, method)) {
    return true;
  }

  if (isPlatformProtectedOrderPath(pathname, method)) {
    return true;
  }

  if (isPlatformProtectedReviewPath(pathname, method)) {
    return true;
  }

  return isPlatformProtectedEmailPath(pathname);
}

function parseRequestPayload(data) {
  if (!data) {
    return {};
  }

  if (typeof FormData !== "undefined" && data instanceof FormData) {
    return {
      storeId: data.get("storeId") || data.get("StoreId") || "",
      storeSlug: data.get("storeSlug") || data.get("StoreSlug") || "",
    };
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  return typeof data === "object" ? data : {};
}

function extractPathStoreScope(pathname) {
  const patterns = [
    /^\/api\/cart\/([^/]+)$/i,
    /^\/api\/cart\/clear\/([^/]+)$/i,
    /^\/api\/product\/store\/([^/]+)$/i,
    /^\/api\/store-customer-auth\/store\/([^/]+)\/set-password-from-auth-user$/i,
  ];

  for (const pattern of patterns) {
    const match = pathname.match(pattern);

    if (match?.[1]) {
      return normalizeStoreScope({ storeId: match[1] });
    }
  }

  return normalizeStoreScope();
}

function extractPayloadStoreScope(config) {
  const payload = parseRequestPayload(config?.data);

  return normalizeStoreScope({
    storeId: payload?.storeId || payload?.StoreId,
    storeSlug: payload?.storeSlug || payload?.StoreSlug,
  });
}

function extractBrowserStoreScope() {
  if (typeof window === "undefined") {
    return normalizeStoreScope();
  }

  const pathname = String(window.location.pathname || "");
  const marketMatch = pathname.match(/^\/market\/([^/]+)/i);

  return normalizeStoreScope({
    storeSlug: marketMatch?.[1] ? decodeURIComponent(marketMatch[1]) : "",
  });
}

function resolveRequestStoreScope(config) {
  const pathname = normalizePathname(config);
  const pathScope = extractPathStoreScope(pathname);

  if (pathScope.storeId || pathScope.storeSlug) {
    return pathScope;
  }

  const payloadScope = extractPayloadStoreScope(config);

  if (payloadScope.storeId || payloadScope.storeSlug) {
    return payloadScope;
  }

  return extractBrowserStoreScope();
}

function resolveStorefrontSessionForRequest(config, authStore) {
  const requestStoreScope = resolveRequestStoreScope(config);
  const activeStorefrontSession = normalizeStorefrontAuthSession(
    authStore?.storefrontSession,
    requestStoreScope,
  );
  const matchedStoredSession =
    findStorefrontAuthSessionInCollection(
      authStore?.storefrontSessions,
      requestStoreScope,
    )?.[1] || null;

  if (matchedStoredSession) {
    return {
      requestStoreScope,
      storefrontSession: normalizeStorefrontAuthSession(
        matchedStoredSession,
        requestStoreScope,
      ),
    };
  }

  if (doesStorefrontSessionMatchScope(activeStorefrontSession, requestStoreScope)) {
    return {
      requestStoreScope,
      storefrontSession: activeStorefrontSession,
    };
  }

  return {
    requestStoreScope,
    storefrontSession:
      requestStoreScope.storeId || requestStoreScope.storeSlug
        ? null
        : activeStorefrontSession,
  };
}

function resolveAuthContext(config) {
  const pathname = normalizePathname(config);
  const method = getRequestMethod(config);

  if (isStorefrontProtectedPath(pathname, method)) {
    return "storefront";
  }

  if (isPlatformProtectedPath(pathname, method)) {
    return "platform";
  }

  if (isOptionalStorefrontCatalogPath(pathname, method)) {
    return "storefront";
  }

  return "none";
}

function attachAuthHeader(config) {
  const pathname = normalizePathname(config);
  const authContext = resolveAuthContext(config);
  const authStore = useAuthStore.getState();
  const platformToken = getPlatformAuthToken();
  const { requestStoreScope, storefrontSession } =
    resolveStorefrontSessionForRequest(config, authStore);
  const storefrontToken = storefrontSession?.token || "";
  const hasExplicitAuthorization = Boolean(config?.headers?.Authorization);

  config.headers = config.headers ?? {};
  config.metadata = {
    ...(config.metadata || {}),
    authContext: hasExplicitAuthorization ? "manual" : "none",
    storefrontScope: requestStoreScope,
  };

  if (
    hasExplicitAuthorization ||
    isPublicAuthRequest(pathname)
  ) {
    return config;
  }

  if (authContext === "platform" && platformToken) {
    config.headers.Authorization = `Bearer ${platformToken}`;
    config.metadata.authContext = "platform";
    return config;
  }

  if (
    authContext === "storefront" &&
    storefrontToken
  ) {
    config.headers.Authorization = `Bearer ${storefrontToken}`;
    config.metadata.authContext = "storefront";
  }

  return config;
}

function handleRequestError(error) {
  return Promise.reject(error);
}

function unwrapResponse(response) {
  return response?.data;
}

function handleResponseError(error) {
  const requestAuthContext = error?.config?.metadata?.authContext;
  const storefrontScope = error?.config?.metadata?.storefrontScope;

  if (error?.response?.status === 401 && requestAuthContext === "platform") {
    clearPlatformAuthSession();
    useAuthStore.getState().clearPlatformSession();
  }

  if (error?.response?.status === 401 && requestAuthContext === "storefront") {
    clearStorefrontAuthSession(storefrontScope);
    useAuthStore.getState().clearStorefrontSession(storefrontScope);
  }

  return Promise.reject(error);
}

export function setupInterceptors(instance) {
  instance.interceptors.request.use(attachAuthHeader, handleRequestError);
  instance.interceptors.response.use(unwrapResponse, handleResponseError);
  return instance;
}
