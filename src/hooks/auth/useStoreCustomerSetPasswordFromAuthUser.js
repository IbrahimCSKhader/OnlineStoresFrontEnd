import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";

export default function useStoreCustomerSetPasswordFromAuthUser(options = {}) {
  return useMutation({
    mutationFn: ({ storeId, appUserToken, ...payload }) =>
      storeCustomerAuthApi.setPasswordFromAuthUser(
        storeId,
        payload,
        appUserToken,
      ),
    ...options,
  });
}
