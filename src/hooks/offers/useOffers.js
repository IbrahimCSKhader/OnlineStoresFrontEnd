import { useQuery } from "@tanstack/react-query";
import { offerApi } from "../../API/offer.api.js";
import { normalizeListResponse } from "../../utils/collections.js";
export default function useOffers(storeId, management = false) {
  return useQuery({ queryKey: ["offers", storeId, management],
    queryFn: async () => normalizeListResponse(await (management ? offerApi.managed(storeId) : offerApi.active(storeId))),
    enabled: Boolean(storeId), staleTime: 30000 });
}
