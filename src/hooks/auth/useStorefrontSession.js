import { matchPath, useLocation } from "react-router-dom";
import useAuth from "./useAuth.js";
import {
  ensureStorefrontGuestSession,
  getStorefrontSessionState,
} from "../../utils/storefrontSession.js";

function resolveRouteStoreSlug(pathname = "") {
  const storeMatch =
    matchPath("/market/:slug/*", pathname) ||
    matchPath("/market/:slug", pathname);

  return storeMatch?.params?.slug || "";
}

export default function useStorefrontSession(storeId, storeSlug = "") {
  const location = useLocation();
  const auth = useAuth();
  const routeStoreSlug = resolveRouteStoreSlug(location.pathname);
  const effectiveStoreSlug = storeSlug || routeStoreSlug;
  const sessionState = getStorefrontSessionState(
    storeId,
    effectiveStoreSlug,
    auth,
  );

  return {
    ...sessionState,
    ensureStorefrontSession: () =>
      ensureStorefrontGuestSession(storeId, effectiveStoreSlug),
  };
}
