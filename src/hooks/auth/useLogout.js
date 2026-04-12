import { useMutation, useQueryClient } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import useAuth from "./useAuth.js";
import { logAuthFlow } from "../../utils/authFlowDebug.js";
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
      logAuthFlow("Logout cleared storefront session");
      return;
    }

    clearPlatformAuthSession();
    clearPlatformSession();
    logAuthFlow("Logout cleared platform session");
  }

  function clearRelatedQueries() {
    queryClient.removeQueries({ queryKey: queryKeys.auth.me });
    queryClient.removeQueries({ queryKey: ["cart"] });
    queryClient.removeQueries({ queryKey: ["stores"] });
    queryClient.removeQueries({ queryKey: ["products"] });
    queryClient.removeQueries({ queryKey: ["categories"] });
    queryClient.removeQueries({ queryKey: ["sections"] });
    queryClient.removeQueries({ queryKey: ["coupons"] });
    queryClient.removeQueries({ queryKey: ["orders"] });
    queryClient.removeQueries({ queryKey: ["reviews"] });
    queryClient.removeQueries({ queryKey: ["customer-stores"] });
  }

  return useMutation({
    mutationFn: () =>
      authContext === "storefront"
        ? Promise.resolve({ success: true })
        : authApi.logout(),
    ...options,
    onSuccess: (data, variables, context) => {
      clearCurrentSession();
      clearRelatedQueries();
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      clearCurrentSession();
      clearRelatedQueries();
      options.onError?.(error, variables, context);
    },
  });
}
