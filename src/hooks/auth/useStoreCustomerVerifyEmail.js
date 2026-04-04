import { useMutation } from "@tanstack/react-query";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";

export default function useStoreCustomerVerifyEmail(options = {}) {
  return useMutation({
    mutationFn: storeCustomerAuthApi.verifyEmail,
    ...options,
  });
}
