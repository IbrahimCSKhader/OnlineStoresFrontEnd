import { useMutation, useQueryClient } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import useAuthStore from "../../store/authStore.js";
import { clearAuthSession } from "../../utils/token.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useLogout(options = {}) {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: authApi.logout,
    ...options,
    onSuccess: (data, variables, context) => {
      clearAuthSession();
      clearSession();
      queryClient.removeQueries({ queryKey: queryKeys.auth.me });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      clearAuthSession();
      clearSession();
      options.onError?.(error, variables, context);
    },
  });
}
