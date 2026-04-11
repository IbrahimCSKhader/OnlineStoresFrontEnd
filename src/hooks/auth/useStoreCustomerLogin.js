import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";
import useAuthStore from "../../store/authStore.js";
import {
  extractRole,
  extractToken,
  extractUser,
} from "../../utils/authSession.js";
import {
  setStorefrontAuthToken,
  setStoredStorefrontRole,
  setStoredStorefrontUser,
} from "../../utils/token.js";

export default function useStoreCustomerLogin(options = {}) {
  const setStorefrontSession = useAuthStore(
    (state) => state.setStorefrontSession,
  );

  return useMutation({
    mutationFn: ({ storeId, ...payload }) =>
      storeId
        ? storeCustomerAuthApi.loginByStore(storeId, payload)
        : storeCustomerAuthApi.login(payload),
    ...options,
    onSuccess: (data, variables, context) => {
      const token = extractToken(data);
      const user = extractUser(data, token);
      const role = extractRole(data, token, user);

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
