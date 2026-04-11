import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";

export default function useStoreCustomerForgotPassword(options = {}) {
  return useMutation({
    mutationFn: ({ storeId, ...payload }) =>
      storeId
        ? storeCustomerAuthApi.forgotPasswordByStore(storeId, payload)
        : storeCustomerAuthApi.forgotPassword(payload),
    ...options,
  });
}
