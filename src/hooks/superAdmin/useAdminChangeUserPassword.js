import { useMutation } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";

export default function useAdminChangeUserPassword(options = {}) {
  return useMutation({
    mutationFn: authApi.adminChangePassword,
    ...options,
  });
}
