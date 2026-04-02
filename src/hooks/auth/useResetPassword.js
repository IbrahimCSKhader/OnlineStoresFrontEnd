import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";

export default function useResetPassword(options = {}) {
  return useMutation({
    mutationFn: authApi.resetPassword,
    ...options,
  });
}
