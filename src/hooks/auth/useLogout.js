import { useMutation, useQueryClient } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import useAuth from "./useAuth.js";
import {
  clearPlatformAuthSession,
  clearStorefrontAuthSession,
} from "../../utils/token.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useLogout(options = {}) {
  const queryClient = useQueryClient();
  const {
    authContext,
    clearPlatformSession,
    clearStorefrontSession,
  } = useAuth();

  function clearCurrentSession() {
    if (authContext === "storefront") {
      clearStorefrontAuthSession();
      clearStorefrontSession();
      return;
    }

    clearPlatformAuthSession();
    clearPlatformSession();
  }

  return useMutation({
    mutationFn: () =>
      authContext === "storefront"
        ? Promise.resolve({ success: true })
        : authApi.logout(),
    ...options,
    onSuccess: (data, variables, context) => {
      clearCurrentSession();
      queryClient.removeQueries({ queryKey: queryKeys.auth.me });
      queryClient.removeQueries({ queryKey: ["cart"] });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      clearCurrentSession();
      queryClient.removeQueries({ queryKey: ["cart"] });
      options.onError?.(error, variables, context);
    },
  });
}
