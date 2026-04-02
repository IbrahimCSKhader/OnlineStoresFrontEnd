import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";

export default function useVerifyEmail(options = {}) {
  return useMutation({
    mutationFn: authApi.verifyEmail,
    ...options,
  });
}
