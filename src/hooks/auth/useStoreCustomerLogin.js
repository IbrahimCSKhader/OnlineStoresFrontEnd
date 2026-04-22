import { useMutation, useQueryClient } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";
import useAuthStore from "../../store/authStore.js";
import { queryKeys } from "../../utils/queryKeys.js";
import {
  logAuthFlow,
  serializeAuthFlowError,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";
import {
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
  setStorefrontAuthToken,
  setStoredStorefrontRole,
  setStoredStorefrontUser,
} from "../../utils/token.js";
import {
  applyStoreScopeToUser,
  assertStoreScopedAuthResult,
  resolveStoreScopedAuthResult,
} from "../../utils/storeCustomerAuth.js";

export default function useStoreCustomerLogin(options = {}) {
  const queryClient = useQueryClient();
  const setStorefrontSession = useAuthStore(
    (state) => state.setStorefrontSession,
  );
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);

  function clearOwnerDashboardQueries() {
    queryClient.removeQueries({ queryKey: queryKeys.stores.all });
    queryClient.removeQueries({ queryKey: ["stores"] });
    queryClient.removeQueries({ queryKey: ["products"] });
    queryClient.removeQueries({ queryKey: ["categories"] });
    queryClient.removeQueries({ queryKey: ["sections"] });
    queryClient.removeQueries({ queryKey: ["coupons"] });
    queryClient.removeQueries({ queryKey: ["orders"] });
    queryClient.removeQueries({ queryKey: ["reviews"] });
    queryClient.removeQueries({ queryKey: ["customer-stores"] });
  }

  return useMutation({
    mutationFn: async ({ storeId, storeSlug, storeName, ...payload }) => {
      logAuthFlow("Store login request", {
        requestStoreId: String(storeId || ""),
        email: String(payload?.email || "").trim(),
        hasPassword: Boolean(payload?.password),
      });

      try {
        const data = storeId
          ? await storeCustomerAuthApi.loginByStore(storeId, payload)
          : await storeCustomerAuthApi.login(payload);

        if (storeId) {
          assertStoreScopedAuthResult(resolveStoreScopedAuthResult(data, storeId));
        }

        return data;
      } catch (error) {
        logAuthFlow("Store login request failed", {
          requestStoreId: String(storeId || ""),
          email: String(payload?.email || "").trim(),
          error: serializeAuthFlowError(error),
        });
        throw error;
      }
    },
    ...options,
    onSuccess: (data, variables, context) => {
      const authResult = resolveStoreScopedAuthResult(data, variables?.storeId);
      const user = applyStoreScopeToUser(authResult.user, {
        storeId: authResult.responseStoreId || variables?.storeId,
        storeSlug: variables?.storeSlug || authResult.responseStoreSlug,
        storeName: variables?.storeName || authResult.responseStoreName,
      });
      const { token, role, isOwner } = authResult;

      logAuthFlow("Store login response classified", {
        requestStoreId: String(variables?.storeId || ""),
        responseStoreId: authResult.responseStoreId,
        responseStoreCustomerId: authResult.responseStoreCustomerId,
        dashboard: authResult.dashboard,
        sessionScope: authResult.sessionScope,
        isOwner,
        isCustomer: authResult.isCustomer,
        role,
        user: serializeAuthFlowUser(user),
      });

      if (isOwner) {
        clearOwnerDashboardQueries();

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
