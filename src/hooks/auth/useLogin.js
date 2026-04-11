import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import {
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
} from "../../utils/token.js";

export default function useLogin(options = {}) {
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);

  return useMutation({
    mutationFn: authApi.login,
    ...options,
    onSuccess: (data, variables, context) => {
      const token = extractToken(data);
      const user = extractUser(data, token);
      const role = extractRole(data, token, user);

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
    },
  });
}
