import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";
import useAuthStore from "../../store/authStore.js";
import {
  extractRole,
  extractToken,
  extractUser,
} from "../../utils/authSession.js";
import {
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
  setStorefrontAuthToken,
  setStoredStorefrontRole,
  setStoredStorefrontUser,
} from "../../utils/token.js";

function normalizeValue(value) {
  return String(value || "").trim();
}

function resolveDashboard(data = {}, user = {}) {
  const value = normalizeValue(
    data?.dashboard ||
      data?.Dashboard ||
      data?.data?.dashboard ||
      data?.data?.Dashboard,
  ).toLowerCase();

  if (value === "owner") return "owner";
  if (value === "customer") return "customer";

  const accountType = normalizeValue(
    data?.accountType ||
      data?.AccountType ||
      user?.accountType ||
      user?.AccountType,
  ).toLowerCase();
  const role = normalizeValue(
    data?.role ||
      data?.roles ||
      user?.role ||
      user?.roles,
  ).toLowerCase();

  if (accountType === "storeowner" || role.includes("owner")) {
    return "owner";
  }

  return "customer";
}

function resolveResponseStoreId(data = {}, user = {}) {
  return normalizeValue(
    data?.storeId ||
      data?.StoreId ||
      data?.data?.storeId ||
      user?.storeId ||
      user?.StoreId ||
      user?.store?.id,
  );
}

export default function useStoreCustomerLogin(options = {}) {
  const setStorefrontSession = useAuthStore(
    (state) => state.setStorefrontSession,
  );
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);

  return useMutation({
    mutationFn: async ({ storeId, ...payload }) => {
      const data = storeId
        ? await storeCustomerAuthApi.loginByStore(storeId, payload)
        : await storeCustomerAuthApi.login(payload);

      const responseStoreId = resolveResponseStoreId(data, extractUser(data));
      const requestStoreId = normalizeValue(storeId);

      if (requestStoreId && responseStoreId && requestStoreId !== responseStoreId) {
        const mismatchError = new Error(
          "Store context mismatch. Please login again for the current store.",
        );
        mismatchError.code = "STORE_SCOPE_MISMATCH";
        throw mismatchError;
      }

      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      const token = extractToken(data);
      const user = extractUser(data, token);
      const role = extractRole(data, token, user);
      const dashboard = resolveDashboard(data, user);

      if (dashboard === "owner") {
        if (token) {
          setPlatformAuthToken(token);
        }

        if (user) {
          setStoredPlatformUser(user);
        }

        if (role) {
          setStoredPlatformRole(role);
        }

        if (token || user || role) {
          setPlatformSession({ token, user, role });
        }

        options.onSuccess?.(data, variables, context);
        return;
      }

      if (token) {
        setStorefrontAuthToken(token);
      }

      if (user) {
        setStoredStorefrontUser(user);
      }

      if (role) {
        setStoredStorefrontRole(role);
      }

      if (token || user || role) {
        setStorefrontSession({ token, user, role });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
