import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStores(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.stores.all,
    queryFn: () => storeApi.getStores(params),
    ...options,
  });
}
