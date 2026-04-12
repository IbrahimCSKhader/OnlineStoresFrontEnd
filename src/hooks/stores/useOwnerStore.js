import { useEffect, useMemo } from "react";
import useAuth from "../auth/useAuth.js";
import useStoreDetails from "./useStoreDetails.js";
import useStores from "./useStores.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
} from "../../utils/collections.js";
import {
  logAuthFlow,
  serializeAuthFlowStore,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";

function normalize(value) {
  if (!value) return "";
  return String(value).trim().toLowerCase();
}

function resolveSessionStoreId(user) {
  return String(user?.storeId || user?.StoreId || user?.store?.id || "").trim();
}

export default function useOwnerStore(options = {}) {
  const { user } = useAuth();
  const sessionStoreId = resolveSessionStoreId(user);
  const isEnabled = options.enabled ?? true;
  const storeDetailsQuery = useStoreDetails(sessionStoreId, {
    ...options,
    enabled: Boolean(sessionStoreId) && isEnabled,
  });
  const storesQuery = useStores(undefined, {
    ...options,
    enabled: !sessionStoreId && isEnabled,
  });

  const resolution = useMemo(() => {
    const detailStore = normalizeEntityResponse(storeDetailsQuery.data);

    if (sessionStoreId) {
      if (detailStore?.id) {
        return {
          store: detailStore,
          source: "session-store-id",
        };
      }

      return {
        store: null,
        source: storeDetailsQuery.isLoading ? "session-store-id:loading" : "session-store-id:unresolved",
      };
    }

    const stores = normalizeListResponse(storesQuery.data);

    if (!stores.length) {
      return {
        store: null,
        source: storesQuery.isLoading ? "store-list:loading" : "store-list:empty",
      };
    }

    const userId = normalize(user?.id || user?.userId || user?.sub);
    const userEmail = normalize(user?.email);

    const byOwnerId = stores.find((item) => normalize(item.ownerId) === userId);
    if (byOwnerId) {
      return {
        store: byOwnerId,
        source: "owner-id",
      };
    }

    const byOwnerEmail = stores.find(
      (item) => normalize(item.ownerEmail) === userEmail,
    );
    if (byOwnerEmail) {
      return {
        store: byOwnerEmail,
        source: "owner-email",
      };
    }

    return {
      store: null,
      source: "unresolved",
    };
  }, [
    sessionStoreId,
    storeDetailsQuery.data,
    storeDetailsQuery.isLoading,
    storesQuery.data,
    storesQuery.isLoading,
    user,
  ]);

  const ownerStore = resolution.store;
  const ownerStoreSource = resolution.source;
  const isLoading = sessionStoreId
    ? storeDetailsQuery.isLoading
    : storesQuery.isLoading;
  const isFetching = sessionStoreId
    ? storeDetailsQuery.isFetching
    : storesQuery.isFetching;
  const error = storeDetailsQuery.error || storesQuery.error || null;

  useEffect(() => {
    logAuthFlow("Owner store resolution", {
      sessionStoreId,
      ownerStoreSource,
      user: serializeAuthFlowUser(user),
      ownerStore: serializeAuthFlowStore(ownerStore),
      storeDetailsStatus: storeDetailsQuery.status,
      storesStatus: storesQuery.status,
      isLoading,
      isFetching,
      hasError: Boolean(error),
    });
  }, [
    error,
    isFetching,
    isLoading,
    ownerStore,
    ownerStoreSource,
    sessionStoreId,
    storeDetailsQuery.status,
    storesQuery.status,
    user,
  ]);

  return {
    ...(sessionStoreId ? storeDetailsQuery : storesQuery),
    ownerStore,
    ownerStoreSource,
    isLoading,
    isFetching,
    error,
    storeDetailsQuery,
    storesQuery,
  };
}
