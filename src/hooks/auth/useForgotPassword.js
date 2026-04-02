import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";

export default function useForgotPassword(options = {}) {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    ...options,
  });
}
