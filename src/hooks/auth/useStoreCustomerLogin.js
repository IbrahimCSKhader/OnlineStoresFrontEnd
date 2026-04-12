import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";
import useAuthStore from "../../store/authStore.js";
import {
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
  setStorefrontAuthToken,
  setStoredStorefrontRole,
  setStoredStorefrontUser,
} from "../../utils/token.js";
import {
  assertStoreScopedAuthResult,
  resolveStoreScopedAuthResult,
} from "../../utils/storeCustomerAuth.js";

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

      if (storeId) {
        assertStoreScopedAuthResult(resolveStoreScopedAuthResult(data, storeId));
      }

      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      const authResult = resolveStoreScopedAuthResult(data, variables?.storeId);
      const { token, user, role, isOwner } = authResult;

      if (isOwner) {
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
