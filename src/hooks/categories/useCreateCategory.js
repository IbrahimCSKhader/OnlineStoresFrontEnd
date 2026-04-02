import { useMutation, useQueryClient } from "@tanstack/react-query";
import categoryApi from "../../API/category.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCreateCategory(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryApi.createCategory,
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.categories.byStore(storeId),
        });
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}
