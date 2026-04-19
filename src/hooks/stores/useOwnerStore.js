import { useEffect, useMemo } from "react";
import useAuth from "../auth/useAuth.js";
import { useQuery } from "@tanstack/react-query";
import storeApi from "../../API/store.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { isOwnerRole } from "../../utils/roles.js";
import {
  logAuthFlow,
  serializeAuthFlowStore,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";

export default function useOwnerStore(options = {}) {
  const { user, platformRole, isPlatformAuthenticated } = useAuth();
  const ownerUserId = String(user?.id || "");
  const ownerUserStoreId = String(
    user?.storeId || user?.StoreId || user?.store?.id || "",
  );
  const canLoadOwnedStore =
    (options.enabled ?? true) &&
    isPlatformAuthenticated &&
    isOwnerRole(platformRole || user?.accountType);

  const ownerStoreQuery = useQuery({
    queryKey: queryKeys.stores.detail(`owned:${ownerUserId || "anonymous"}`),
    queryFn: async () => {
      try {
        return await storeApi.getOwnedStore();
      } catch (error) {
        if (!ownerUserStoreId) {
          throw error;
        }

        logAuthFlow(
          "Owned store endpoint failed, falling back to storeId from session",
          {
            user: serializeAuthFlowUser(user),
            ownerUserStoreId,
            statusCode: Number(error?.response?.status || 0),
            errorMessage:
              error?.response?.data?.message ||
              error?.message ||
              "owned-store-request-failed",
          },
        );

        return storeApi.getStoreById(ownerUserStoreId);
      }
    },
    enabled: canLoadOwnedStore,
    ...options,
  });

  const ownerStore = useMemo(
    () => normalizeEntityResponse(ownerStoreQuery.data),
    [ownerStoreQuery.data],
  );
  const ownerStoreSource = ownerStore?.id
    ? "owned-store-endpoint"
    : ownerUserStoreId && ownerStoreQuery.isSuccess
      ? "owned-store:session-storeId-fallback"
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
      canLoadOwnedStore,
      ownerUserStoreId,
      ownedStoreStatus: ownerStoreQuery.status,
      isLoading,
      isFetching,
      hasError: Boolean(error),
    });
  }, [
    error,
    canLoadOwnedStore,
    isFetching,
    isLoading,
    ownerStore,
    ownerStoreSource,
    ownerUserStoreId,
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
    ownerUserStoreId,
  };
}
