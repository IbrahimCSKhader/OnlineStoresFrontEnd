import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import orderApi from "../../API/order.api.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStoreOrders(storeId, options = {}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.orders.byStore(storeId),
    queryFn: () => orderApi.getStoreOrders(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    ...options,
  });

  useEffect(() => {
    if (!storeId || typeof window === "undefined") {
      return undefined;
    }

    const handleOrderStorageUpdate = (event) => {
      if (event.key !== "store-order-updated" || !event.newValue) {
        return;
      }

      try {
        const update = JSON.parse(event.newValue);

        if (String(update?.storeId || "") === String(storeId)) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.orders.byStore(storeId),
          });
        }
      } catch {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byStore(storeId),
        });
      }
    };

    window.addEventListener("storage", handleOrderStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleOrderStorageUpdate);
    };
  }, [queryClient, storeId]);

  return query;
}
