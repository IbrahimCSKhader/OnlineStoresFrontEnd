import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../API/axiosInstance.js";
import { normalizeEntityResponse, normalizeListResponse } from "../../utils/collections.js";

const path = storeId => `/api/order-invoice-prints/store/${storeId}`;
const key = storeId => ["order-invoice-prints", storeId];

export function useOrderPrintCounts(storeId) {
  return useQuery({ queryKey: key(storeId), enabled: Boolean(storeId), staleTime: 15000,
    queryFn: async () => normalizeListResponse(await axiosInstance.get(path(storeId))), retry: 1 });
}

export function useRecordOrderPrint(storeId) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, requestId }) => normalizeEntityResponse(await axiosInstance.post(`${path(storeId)}/${orderId}`, { requestId })),
    retry: 2,
    retryDelay: 500,
    onSuccess: result => {
      cache.setQueryData(key(storeId), previous => [...(previous || []).filter(x => x.orderId !== result.orderId), result]);
      cache.invalidateQueries({ queryKey: key(storeId) });
    },
  });
}
