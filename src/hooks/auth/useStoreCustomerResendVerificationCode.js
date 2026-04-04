import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";

export default function useStoreCustomerResendVerificationCode(options = {}) {
  return useMutation({
    mutationFn: storeCustomerAuthApi.resendVerificationCode,
    ...options,
  });
}
