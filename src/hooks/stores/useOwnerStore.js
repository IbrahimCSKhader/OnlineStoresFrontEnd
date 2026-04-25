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
import { getOwnerSessionStoreScope } from "../../utils/storeOwnerScope.js";

export default function useOwnerStore(options = {}) {
  const { platformUser, platformRole, isPlatformAuthenticated, platformToken } =
    useAuth();
  const ownerUserId = String(platformUser?.id || "");
  const ownerSessionScope = getOwnerSessionStoreScope(platformUser);
  const ownerUserStoreId = ownerSessionScope.storeId;
  const ownerUserStoreSlug = ownerSessionScope.storeSlug;
  const ownerScopeKey =
    ownerUserStoreId ||
    (ownerUserStoreSlug ? `slug:${ownerUserStoreSlug}` : "unscoped");
  const canLoadOwnedStore =
    (options.enabled ?? true) &&
    isPlatformAuthenticated &&
    isOwnerRole(platformRole || platformUser?.accountType);

  const ownerStoreQuery = useQuery({
    queryKey: queryKeys.stores.detail(`owned:${ownerUserId || "anonymous"}:${ownerScopeKey}`),
    queryFn: async () => {
      if (ownerUserStoreId && platformToken) {
        return storeApi.getStoreByIdWithAuth(ownerUserStoreId, platformToken);
      }

      if (ownerUserStoreSlug && platformToken) {
        return storeApi.getStoreBySlugWithAuth(ownerUserStoreSlug, platformToken);
      }

      try {
        return await storeApi.getOwnedStore();
      } catch (error) {
        if (!ownerUserStoreId && !ownerUserStoreSlug) {
          throw error;
        }

        logAuthFlow(
          "Owned store endpoint failed, falling back to session store scope",
          {
            user: serializeAuthFlowUser(platformUser),
            ownerUserStoreId,
            ownerUserStoreSlug,
            statusCode: Number(error?.response?.status || 0),
            errorMessage:
              error?.response?.data?.message ||
              error?.message ||
              "owned-store-request-failed",
          },
        );

        if (ownerUserStoreId) {
          return storeApi.getStoreById(ownerUserStoreId);
        }

        return storeApi.getStoreBySlug(ownerUserStoreSlug);
      }
    },
    enabled: canLoadOwnedStore,
    ...options,
  });

  const ownerStore = useMemo(
    () => normalizeEntityResponse(ownerStoreQuery.data),
    [ownerStoreQuery.data],
  );
  const ownerStoreSource =
    ownerUserStoreId && ownerStore?.id
      ? "owned-store:session-storeId"
      : ownerUserStoreSlug && ownerStore?.slug
        ? "owned-store:session-storeSlug"
      : ownerStore?.id
        ? "owned-store-endpoint"
        : (ownerUserStoreId || ownerUserStoreSlug) && ownerStoreQuery.isSuccess
          ? "owned-store:session-scope-fallback"
          : ownerStoreQuery.isLoading
            ? "owned-store:endpoint-loading"
            : "owned-store:endpoint-empty";
  const isLoading = ownerStoreQuery.isLoading;
  const isFetching = ownerStoreQuery.isFetching;
  const error = ownerStoreQuery.error || null;

  useEffect(() => {
    logAuthFlow("Owner store resolution", {
      ownerStoreSource,
      user: serializeAuthFlowUser(platformUser),
      ownerStore: serializeAuthFlowStore(ownerStore),
      canLoadOwnedStore,
      ownerUserStoreId,
      ownerUserStoreSlug,
      hasScopedOwnerStore: Boolean(ownerUserStoreId || ownerUserStoreSlug),
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
    ownerUserStoreSlug,
    platformToken,
    ownerStoreQuery.status,
    platformUser,
  ]);

  return {
    ...ownerStoreQuery,
    ownerStore,
    ownerStoreSource,
    isLoading,
    isFetching,
    error,
    ownerUserStoreId,
    ownerUserStoreSlug,
  };
}
