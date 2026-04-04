import { getAuthToken, clearAuthSession } from "../utils/token.js";
import useAuthStore from "../store/authStore.js";

const publicAuthPaths = [
  "/api/Auth/login",
  "/api/Auth/register",
  "/api/Auth/verify-email",
  "/api/Auth/resend-verification-code",
  "/api/Auth/forgot-password",
  "/api/Auth/reset-password",
  "/api/Auth/google",
  "/api/Auth/google-callback",
  "/api/store-customer-auth/login",
  "/api/store-customer-auth/register",
  "/api/store-customer-auth/guest",
  "/api/store-customer-auth/forgot-password",
  "/api/store-customer-auth/reset-password",
];

function getRequestUrl(config) {
  return String(config?.url || "");
}

function isPublicAuthRequest(configOrUrl) {
  const url =
    typeof configOrUrl === "string" ? configOrUrl : getRequestUrl(configOrUrl);

  return publicAuthPaths.some((path) => url.includes(path));
}

function attachAuthHeader(config) {
  const token = getAuthToken();

  if (token && !isPublicAuthRequest(config)) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
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
  const hadAuthHeader = Boolean(error?.config?.headers?.Authorization);

  if (error?.response?.status === 401 && hadAuthHeader && !isPublicAuthRequest(error?.config)) {
    clearAuthSession();
    useAuthStore.getState().clearSession();
  }

  return Promise.reject(error);
}

export function setupInterceptors(instance) {
  instance.interceptors.request.use(attachAuthHeader, handleRequestError);
  instance.interceptors.response.use(unwrapResponse, handleResponseError);
  return instance;
}
