import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";

export default function useStoreCustomerResetPassword(options = {}) {
  return useMutation({
    mutationFn: ({ storeId, ...payload }) =>
      storeId
        ? storeCustomerAuthApi.resetPasswordByStore(storeId, payload)
        : storeCustomerAuthApi.resetPassword(payload),
    ...options,
  });
}
