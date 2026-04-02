import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";

export default function useRegister(options = {}) {
  return useMutation({
    mutationFn: authApi.register,
    ...options,
  });
}
