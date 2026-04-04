import { useMutation, useQueryClient } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import useAuthStore from "../../store/authStore.js";
import useAuth from "./useAuth.js";
import { clearAuthSession } from "../../utils/token.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useLogout(options = {}) {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const { hasStorefrontCustomerSession } = useAuth();

  return useMutation({
    mutationFn: () =>
      hasStorefrontCustomerSession ? Promise.resolve({ success: true }) : authApi.logout(),
    ...options,
    onSuccess: (data, variables, context) => {
      clearAuthSession();
      clearSession();
      queryClient.removeQueries({ queryKey: queryKeys.auth.me });
      queryClient.removeQueries({ queryKey: ["cart"] });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      clearAuthSession();
      clearSession();
      queryClient.removeQueries({ queryKey: ["cart"] });
      options.onError?.(error, variables, context);
    },
  });
}
