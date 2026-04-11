import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import {
  setStorefrontAuthToken,
  setStoredStorefrontRole,
  setStoredStorefrontUser,
} from "../../utils/token.js";

export default function useStoreCustomerRegister(options = {}) {
  const setStorefrontSession = useAuthStore((state) => state.setStorefrontSession);

  return useMutation({
    mutationFn: storeCustomerAuthApi.register,
    ...options,
    onSuccess: (data, variables, context) => {
      const token = extractToken(data);
      if (token) {
        const user = extractUser(data, token);
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
