import { matchPath, useLocation, useSearchParams } from "react-router-dom";
import useAuth from "../auth/useAuth.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { isOwnerRole } from "../../utils/roles.js";
import useOwnerStore from "./useOwnerStore.js";
import useStoreBySlug from "./useStoreBySlug.js";

export const OWNER_PREVIEW_PARAM = "preview";
export const OWNER_PREVIEW_VALUE = "owner";
export const OWNER_PREVIEW_SEARCH = `?${OWNER_PREVIEW_PARAM}=${OWNER_PREVIEW_VALUE}`;

export function buildPreviewPath(pathname, previewSearch = "") {
  return previewSearch ? { pathname, search: previewSearch } : pathname;
}

export default function useOwnerStorePreview() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isPlatformAuthenticated, platformRole, platformUser } = useAuth();
  const isOwnerSession =
    isPlatformAuthenticated && isOwnerRole(platformRole);
  const isPreviewRequested =
    searchParams.get(OWNER_PREVIEW_PARAM) === OWNER_PREVIEW_VALUE;
  const storeRouteMatch =
    matchPath("/market/:slug/*", location.pathname) ??
    matchPath("/market/:slug", location.pathname);
  const activeStoreSlug = storeRouteMatch?.params?.slug || "";
  const ownerUserStoreId = String(
    platformUser?.storeId || platformUser?.StoreId || platformUser?.store?.id || "",
  ).trim();
  const activeStoreQuery = useStoreBySlug(activeStoreSlug, {
    enabled: isOwnerSession && isPreviewRequested && Boolean(activeStoreSlug),
    staleTime: 60000,
  });
  const activeStore = normalizeEntityResponse(activeStoreQuery.data);
  const ownerStoreQuery = useOwnerStore({
    enabled:
      isOwnerSession &&
      isPreviewRequested &&
      Boolean(activeStoreSlug) &&
      !ownerUserStoreId,
    staleTime: 60000,
  });
  const ownerStoreId = String(
    ownerStoreQuery.ownerStore?.id || ownerUserStoreId || "",
  ).trim();
  const activeStoreId = String(activeStore?.id || "").trim();
  const isOwnerPreview =
    isOwnerSession &&
    isPreviewRequested &&
    Boolean(activeStoreId) &&
    Boolean(ownerStoreId) &&
    activeStoreId === ownerStoreId;
  const previewSearch = isOwnerPreview ? OWNER_PREVIEW_SEARCH : "";

  return {
    isOwnerPreview,
    previewSearch,
    buildStorePreviewPath: (pathname) => buildPreviewPath(pathname, previewSearch),
  };
}
