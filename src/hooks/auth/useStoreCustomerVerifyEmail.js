import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";
import {
  assertStoreScopedAuthResult,
  resolveStoreScopedAuthResult,
} from "../../utils/storeCustomerAuth.js";

export default function useStoreCustomerVerifyEmail(options = {}) {
  return useMutation({
    mutationFn: async ({ storeId, ...payload }) => {
      const data = await (storeId
        ? storeCustomerAuthApi.verifyEmailByStore(storeId, payload)
        : storeCustomerAuthApi.verifyEmail(payload));

      if (storeId) {
        assertStoreScopedAuthResult(resolveStoreScopedAuthResult(data, storeId));
      }

      return data;
    },
    ...options,
  });
}
