import { useEffect, useMemo } from "react";
import useAuth from "../auth/useAuth.js";
import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import {
  logAuthFlow,
  serializeAuthFlowStore,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";

export default function useOwnerStore(options = {}) {
  const { user } = useAuth();
  const ownerStoreQuery = useQuery({
    queryKey: queryKeys.stores.detail("owned"),
    queryFn: () => storeApi.getOwnedStore(),
    enabled: options.enabled ?? true,
    ...options,
  });

  const ownerStore = useMemo(
    () => normalizeEntityResponse(ownerStoreQuery.data),
    [ownerStoreQuery.data],
  );
  const ownerStoreSource = ownerStore?.id
    ? "owned-store-endpoint"
    : ownerStoreQuery.isLoading
      ? "owned-store:endpoint-loading"
      : "owned-store:endpoint-empty";
  const isLoading = ownerStoreQuery.isLoading;
  const isFetching = ownerStoreQuery.isFetching;
  const error = ownerStoreQuery.error || null;

  useEffect(() => {
    logAuthFlow("Owner store resolution", {
      ownerStoreSource,
      user: serializeAuthFlowUser(user),
      ownerStore: serializeAuthFlowStore(ownerStore),
      ownedStoreStatus: ownerStoreQuery.status,
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
    ownerStoreQuery.status,
    user,
  ]);

  return {
    ...ownerStoreQuery,
    ownerStore,
    ownerStoreSource,
    isLoading,
    isFetching,
    error,
  };
}
