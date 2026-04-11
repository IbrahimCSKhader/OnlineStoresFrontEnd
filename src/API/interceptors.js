import {
  clearPlatformAuthSession,
  clearStorefrontAuthSession,
  getPlatformAuthToken,
  getStorefrontAuthToken,
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
  if (pathname === "/api/store" && method === "post") {
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

function resolveSessionStoreId(user) {
  return String(user?.storeId || user?.StoreId || user?.store?.id || "").trim();
}

function extractPathStoreId(pathname) {
  const storeCartMatch = pathname.match(/^\/api\/cart\/([^/]+)$/);
  if (storeCartMatch) {
    return storeCartMatch[1];
  }

  const productStoreMatch = pathname.match(/^\/api\/product\/store\/([^/]+)$/);
  if (productStoreMatch) {
    return productStoreMatch[1];
  }

  return "";
}

function shouldAttachStorefrontToken(pathname, storefrontUser) {
  if (!isOptionalStorefrontCatalogPath(pathname, "get")) {
    return true;
  }

  const requestStoreId = extractPathStoreId(pathname);
  const sessionStoreId = resolveSessionStoreId(storefrontUser);

  return !requestStoreId || !sessionStoreId || requestStoreId === sessionStoreId;
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
  const storefrontUser = authStore?.storefrontSession?.user;
  const platformToken = getPlatformAuthToken();
  const storefrontToken = getStorefrontAuthToken();
  const hasExplicitAuthorization = Boolean(config?.headers?.Authorization);

  config.headers = config.headers ?? {};
  config.metadata = {
    ...(config.metadata || {}),
    authContext: hasExplicitAuthorization ? "manual" : "none",
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
    storefrontToken &&
    shouldAttachStorefrontToken(pathname, storefrontUser)
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

  if (error?.response?.status === 401 && requestAuthContext === "platform") {
    clearPlatformAuthSession();
    useAuthStore.getState().clearPlatformSession();
  }

  if (error?.response?.status === 401 && requestAuthContext === "storefront") {
    clearStorefrontAuthSession();
    useAuthStore.getState().clearStorefrontSession();
  }

  return Promise.reject(error);
}

export function setupInterceptors(instance) {
  instance.interceptors.request.use(attachAuthHeader, handleRequestError);
  instance.interceptors.response.use(unwrapResponse, handleResponseError);
  return instance;
}
