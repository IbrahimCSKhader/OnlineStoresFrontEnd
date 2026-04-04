import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import { isSuperAdminRole } from "../../utils/roles.js";
import {
  clearAuthSession,
  setAuthToken,
  setStoredAuthRole,
  setStoredAuthUser,
} from "../../utils/token.js";

export default function useSuperAdminLogin(options = {}) {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: async (payload) => {
      const data = await authApi.login(payload);
      const token = extractToken(data);
      const user = extractUser(data, token);
      const role = extractRole(data, token, user);

      if (!isSuperAdminRole(role) && !isSuperAdminRole(user?.accountType)) {
        const error = new Error("This account does not have Super Admin access.");
        error.code = "NOT_SUPERADMIN";
        throw error;
      }

      return { data, token, user, role };
    },
    ...options,
    onSuccess: (result, variables, context) => {
      if (result.token) {
        setAuthToken(result.token);
      }

      if (result.user) {
        setStoredAuthUser(result.user);
      }

      if (result.role) {
        setStoredAuthRole(result.role);
      }

      setSession({
        token: result.token,
        user: result.user,
        role: result.role,
      });

      options.onSuccess?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      if (error?.code === "NOT_SUPERADMIN") {
        clearAuthSession();
        clearSession();
      }

      options.onError?.(error, variables, context);
    },
  });
}
