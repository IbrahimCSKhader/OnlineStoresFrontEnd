import { useMutation, useQueryClient } from "@tanstack/react-query";
import useStorefrontSession from "../auth/useStorefrontSession.js";
import { offerApi } from "../../API/offer.api.js";
import { addGuestBundle } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";
export default function useAddBundle(store) {
  const session = useStorefrontSession(store?.id, store?.slug);
  const cache = useQueryClient();
  return useMutation({
    mutationFn: offer => session.useLocalGuestCart
      ? addGuestBundle(store.id, offer)
      : offerApi.addBundle({ storeId: store.id, offerId: offer.id, quantity: 1 }),
    onSuccess: data => cache.setQueryData(queryKeys.cart.byStore(store.id), data),
  });
}
