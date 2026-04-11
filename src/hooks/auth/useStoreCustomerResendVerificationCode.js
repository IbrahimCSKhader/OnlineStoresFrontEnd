import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";

export default function useStoreCustomerResendVerificationCode(options = {}) {
  return useMutation({
    mutationFn: ({ storeId, ...payload }) =>
      storeId
        ? storeCustomerAuthApi.resendVerificationCodeByStore(storeId, payload)
        : storeCustomerAuthApi.resendVerificationCode(payload),
    ...options,
  });
}
