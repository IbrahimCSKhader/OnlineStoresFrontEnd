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
  setStorefrontAuthSession,
} from "../../utils/token.js";

export default function useStoreCustomerRegister(options = {}) {
  const setStorefrontSession = useAuthStore(
    (state) => state.setStorefrontSession,
  );

  return useMutation({
    mutationFn: ({ storeId, ...payload }) =>
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
        const storefrontScope = {
          storeId: variables?.storeId || user?.storeId,
          storeSlug: variables?.storeSlug || user?.storeSlug,
        };

        setStorefrontAuthSession(storefrontScope, { token, user, role });
        setStorefrontSession({ token, user, role, ...storefrontScope });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
