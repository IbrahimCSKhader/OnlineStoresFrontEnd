import { useMutation, useQueryClient } from "@tanstack/react-query";
import cartApi from "../../API/cart.api.js";
import useAuth from "../auth/useAuth.js";
import { clearGuestCart } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useClearCart(storeId, options = {}) {
  const queryClient = useQueryClient();
  const { isStoreCustomer } = useAuth();

  return useMutation({
    mutationFn: () => (isStoreCustomer ? cartApi.clearCart(storeId) : clearGuestCart(storeId)),
    ...options,
    onSuccess: (data, variables, context) => {
      if (storeId) {
        queryClient.setQueryData(
          queryKeys.cart.byStore(storeId),
          isStoreCustomer
            ? {
                id: "",
                storeCustomerId: "",
                storeId,
                items: [],
                subtotal: 0,
                totalAmount: 0,
                itemCount: 0,
                totalItems: 0,
              }
            : data,
        );
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
