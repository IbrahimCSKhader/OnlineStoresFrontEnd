import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";
import useAuthStore from "../../store/authStore.js";
import {
  extractRole,
  extractToken,
  extractUser,
} from "../../utils/authSession.js";
import { applyStoreScopeToUser } from "../../utils/storeCustomerAuth.js";
import {
  setStorefrontAuthToken,
  setStoredStorefrontRole,
  setStoredStorefrontUser,
} from "../../utils/token.js";

export default function useStoreCustomerRegister(options = {}) {
  const setStorefrontSession = useAuthStore(
    (state) => state.setStorefrontSession,
  );

  return useMutation({
    mutationFn: ({ storeId, storeSlug, storeName, ...payload }) =>
      storeId
        ? storeCustomerAuthApi.registerByStore(storeId, payload)
        : storeCustomerAuthApi.register(payload),
    ...options,
    onSuccess: (data, variables, context) => {
      const token = extractToken(data);
      if (token) {
        const user = applyStoreScopeToUser(extractUser(data, token), {
          storeId: variables?.storeId,
          storeSlug: variables?.storeSlug,
          storeName: variables?.storeName,
        });
        const role = extractRole(data, token, user);

        setStorefrontAuthToken(token);

        if (user) {
          setStoredStorefrontUser(user);
        }

        if (role) {
          setStoredStorefrontRole(role);
        }

        setStorefrontSession({ token, user, role });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
