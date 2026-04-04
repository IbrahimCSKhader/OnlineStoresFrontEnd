import { useMutation, useQueryClient } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCreateOwnerAccount(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.createOwner,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.owners });
      options.onSuccess?.(data, variables, context);
    },
  });
}
