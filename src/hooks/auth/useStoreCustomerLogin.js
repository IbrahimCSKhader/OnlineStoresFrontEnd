import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import { setAuthToken, setStoredAuthRole, setStoredAuthUser } from "../../utils/token.js";

export default function useStoreCustomerLogin(options = {}) {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: storeCustomerAuthApi.login,
    ...options,
    onSuccess: (data, variables, context) => {
      const token = extractToken(data);
      const user = extractUser(data, token);
      const role = extractRole(data, token, user);

      if (token) {
        setAuthToken(token);
      }

      if (user) {
        setStoredAuthUser(user);
      }

      if (role) {
        setStoredAuthRole(role);
      }

      if (token || user || role) {
        setSession({ token, user, role });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
