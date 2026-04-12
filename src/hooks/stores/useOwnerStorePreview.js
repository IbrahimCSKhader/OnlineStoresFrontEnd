import { useSearchParams } from "react-router-dom";
import useAuth from "../auth/useAuth.js";
import { isOwnerRole } from "../../utils/roles.js";

export const OWNER_PREVIEW_PARAM = "preview";
export const OWNER_PREVIEW_VALUE = "owner";
export const OWNER_PREVIEW_SEARCH = `?${OWNER_PREVIEW_PARAM}=${OWNER_PREVIEW_VALUE}`;

export function buildPreviewPath(pathname, previewSearch = "") {
  return previewSearch ? { pathname, search: previewSearch } : pathname;
}

export default function useOwnerStorePreview() {
  const [searchParams] = useSearchParams();
  const { isPlatformAuthenticated, platformRole } = useAuth();
  const isOwnerPreview =
    isPlatformAuthenticated &&
    isOwnerRole(platformRole) &&
    searchParams.get(OWNER_PREVIEW_PARAM) === OWNER_PREVIEW_VALUE;
  const previewSearch = isOwnerPreview ? OWNER_PREVIEW_SEARCH : "";

  return {
    isOwnerPreview,
    previewSearch,
    buildStorePreviewPath: (pathname) => buildPreviewPath(pathname, previewSearch),
  };
}
