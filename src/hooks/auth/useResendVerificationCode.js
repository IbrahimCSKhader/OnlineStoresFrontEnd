import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";

export default function useResendVerificationCode(options = {}) {
  return useMutation({
    mutationFn: authApi.resendVerificationCode,
    ...options,
  });
}
