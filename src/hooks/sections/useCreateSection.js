import { useMutation, useQueryClient } from "@tanstack/react-query";
import sectionApi from "../../API/section.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useCreateSection(storeId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sectionApi.createSection,
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.sections.byStore(storeId),
        });
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}
