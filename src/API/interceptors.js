import { getAuthToken, clearAuthSession } from "../utils/token.js";
import useAuthStore from "../store/authStore.js";

function attachAuthHeader(config) {
  const token = getAuthToken();

  if (token) {
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
  if (error?.response?.status === 401) {
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
