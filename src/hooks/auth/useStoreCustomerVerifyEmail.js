import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";

export default function useStoreCustomerVerifyEmail(options = {}) {
  return useMutation({
    mutationFn: ({ storeId, ...payload }) =>
      storeId
        ? storeCustomerAuthApi.verifyEmailByStore(storeId, payload)
        : storeCustomerAuthApi.verifyEmail(payload),
    ...options,
  });
}
