import { matchPath, useLocation, useSearchParams } from "react-router-dom";
import useAuth from "../auth/useAuth.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { isOwnerRole } from "../../utils/roles.js";
import { getOwnerSessionStoreScope } from "../../utils/storeOwnerScope.js";
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
  const ownerSessionScope = getOwnerSessionStoreScope(platformUser);
  const ownerUserStoreId = ownerSessionScope.storeId;
  const ownerUserStoreSlug = ownerSessionScope.storeSlug;
  const activeStoreQuery = useStoreBySlug(activeStoreSlug, {
    enabled: isOwnerSession && isPreviewRequested && Boolean(activeStoreSlug),
    staleTime: 60000,
  });
  const activeStore = normalizeEntityResponse(activeStoreQuery.data);
  const ownerStoreId = String(ownerUserStoreId || "").trim();
  const ownerStoreSlug = String(ownerUserStoreSlug || "").trim().toLowerCase();
  const activeStoreId = String(activeStore?.id || "").trim();
  const normalizedActiveStoreSlug = String(activeStoreSlug || "")
    .trim()
    .toLowerCase();
  const isOwnerPreview =
    isOwnerSession &&
    isPreviewRequested &&
    (
      (Boolean(activeStoreId) &&
        Boolean(ownerStoreId) &&
        activeStoreId === ownerStoreId) ||
      (Boolean(normalizedActiveStoreSlug) &&
        Boolean(ownerStoreSlug) &&
        normalizedActiveStoreSlug === ownerStoreSlug)
    );
  const previewSearch = isOwnerPreview ? OWNER_PREVIEW_SEARCH : "";

  return {
    isOwnerPreview,
    previewSearch,
    buildStorePreviewPath: (pathname) => buildPreviewPath(pathname, previewSearch),
  };
}
