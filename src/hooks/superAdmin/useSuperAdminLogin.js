import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import { isSuperAdminRole } from "../../utils/roles.js";
import {
  clearPlatformAuthSession,
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
} from "../../utils/token.js";

export default function useSuperAdminLogin(options = {}) {
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);
  const clearPlatformSession = useAuthStore((state) => state.clearPlatformSession);

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
        setPlatformAuthToken(result.token);
      }

      if (result.user) {
        setStoredPlatformUser(result.user);
      }

      if (result.role) {
        setStoredPlatformRole(result.role);
      }

      setPlatformSession({
        token: result.token,
        user: result.user,
        role: result.role,
      });

      options.onSuccess?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      if (error?.code === "NOT_SUPERADMIN") {
        clearPlatformAuthSession();
        clearPlatformSession();
      }

      options.onError?.(error, variables, context);
    },
  });
}
