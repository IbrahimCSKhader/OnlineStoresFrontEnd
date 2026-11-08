import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import superAdminDashboardApi from "../../API/superAdminDashboard.api.js";
import useAuthStore from "../../store/authStore.js";
import { extractToken, extractUser } from "../../utils/authSession.js";
import {
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
} from "../../utils/token.js";

export default function useSuperAdminLogin(options = {}) {
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);

  return useMutation({
    mutationFn: async (payload) => {
      const data = await authApi.login(payload);
      const token = extractToken(data);
      const user = extractUser(data, token);
      if (!token) {
        const error = new Error("This account does not have Super Admin access.");
        error.code = "NOT_SUPERADMIN";
        throw error;
      }

      await superAdminDashboardApi.verifyPrivateAccess(token);
      return { data, token, user, role: "SuperAdmin" };
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
  });
}
