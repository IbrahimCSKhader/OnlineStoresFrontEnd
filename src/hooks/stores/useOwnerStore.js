import { useMemo } from "react";
import useAuth from "../auth/useAuth.js";
import useStores from "./useStores.js";
import { normalizeListResponse } from "../../utils/collections.js";

function normalize(value) {
  if (!value) return "";
  return String(value).trim().toLowerCase();
}

export default function useOwnerStore(options = {}) {
  const { user } = useAuth();
  const storesQuery = useStores(undefined, options);

  const store = useMemo(() => {
    const stores = normalizeListResponse(storesQuery.data);

    if (!stores.length) return null;

    const userId = normalize(user?.id || user?.userId || user?.sub);
    const userEmail = normalize(user?.email);

    const byOwnerId = stores.find((item) => normalize(item.ownerId) === userId);
    if (byOwnerId) return byOwnerId;

    const byOwnerEmail = stores.find(
      (item) => normalize(item.ownerEmail) === userEmail,
    );
    if (byOwnerEmail) return byOwnerEmail;

    return stores[0];
  }, [storesQuery.data, user]);

  return {
    ...storesQuery,
    ownerStore: store,
  };
}
