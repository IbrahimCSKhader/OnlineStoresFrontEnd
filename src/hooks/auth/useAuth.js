import { matchPath, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";
import { extractStorefrontCustomer } from "../../utils/authSession.js";
import { getPendingGoogleCallbackResult } from "../../utils/pendingGoogleCallbackResult.js";
import {
  getPendingGoogleAuthContext,
  isStoreScopedPendingGoogleAuthContext,
} from "../../utils/pendingGoogleAuthContext.js";
import { isOwnerRole, isSuperAdminRole } from "../../utils/roles.js";
import { STORE_CUSTOMER_AUTH_MODE } from "../../utils/storeCustomerAuth.js";
import {
  doesStorefrontSessionMatchScope,
  findStorefrontAuthSessionInCollection,
  normalizeStoreScope,
  normalizeStorefrontAuthSession,
} from "../../utils/token.js";

function isStorefrontRoute(pathname) {
  return Boolean(
    matchPath("/market/:slug/*", pathname) ||
    matchPath("/market/:slug", pathname),
  );
}

function isPlatformRoute(pathname) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/owner")
  );
}

function shouldPreferStorefrontSession(location) {
  if (isStorefrontRoute(location.pathname)) {
    return true;
  }

  if (location.pathname.startsWith("/auth/google")) {
    const pendingGoogleContext = getPendingGoogleAuthContext();
    const pendingGoogleCallbackResult = getPendingGoogleCallbackResult();

    return (
      pendingGoogleCallbackResult?.sessionType === "storefront" ||
      pendingGoogleCallbackResult?.sessionType === "pending" ||
      isStoreScopedPendingGoogleAuthContext(pendingGoogleContext)
    );
  }

  return (
    location.pathname.startsWith("/auth/") &&
    location.state?.authMode === STORE_CUSTOMER_AUTH_MODE
  );
}

function resolveRequestedStoreScope(location) {
  const storeRouteMatch =
    matchPath("/market/:slug/*", location.pathname) ||
    matchPath("/market/:slug", location.pathname);
  const routeStoreSlug = storeRouteMatch?.params?.slug || "";
  const pendingGoogleContext = getPendingGoogleAuthContext();
  const pendingGoogleCallbackResult = getPendingGoogleCallbackResult();
  const prefersStoreScopedAuth =
    location.state?.authMode === STORE_CUSTOMER_AUTH_MODE ||
    isStoreScopedPendingGoogleAuthContext(pendingGoogleContext) ||
    pendingGoogleCallbackResult?.sessionType === "storefront" ||
    pendingGoogleCallbackResult?.sessionType === "pending";

  return normalizeStoreScope({
    storeId:
      location.state?.storeId ||
      (prefersStoreScopedAuth ? pendingGoogleContext?.storeId : "") ||
      pendingGoogleCallbackResult?.storeId ||
      "",
    storeSlug:
      routeStoreSlug ||
      location.state?.storeSlug ||
      (prefersStoreScopedAuth ? pendingGoogleContext?.storeSlug : "") ||
      pendingGoogleCallbackResult?.storeSlug ||
      "",
  });
}

function resolveScopedStorefrontSession(
  location,
  storefrontSession,
  storefrontSessions,
) {
  const requestedStoreScope = resolveRequestedStoreScope(location);
  const fallbackStorefrontSession = normalizeStorefrontAuthSession(
    storefrontSession,
    requestedStoreScope,
  );
  const matchedSession =
    findStorefrontAuthSessionInCollection(
      storefrontSessions,
      requestedStoreScope,
    )?.[1] || null;

  if (matchedSession) {
    return {
      storefrontSession: normalizeStorefrontAuthSession(
        matchedSession,
        requestedStoreScope,
      ),
      storefrontScope: requestedStoreScope,
    };
  }

  if (doesStorefrontSessionMatchScope(fallbackStorefrontSession, requestedStoreScope)) {
    return {
      storefrontSession: fallbackStorefrontSession,
      storefrontScope: requestedStoreScope,
    };
  }

  if (requestedStoreScope.storeId || requestedStoreScope.storeSlug) {
    return {
      storefrontSession: normalizeStorefrontAuthSession({}, requestedStoreScope),
      storefrontScope: requestedStoreScope,
    };
  }

  return {
    storefrontSession: fallbackStorefrontSession,
    storefrontScope: normalizeStoreScope(fallbackStorefrontSession),
  };
}

function resolveActiveSession(location, platformSession, storefrontSession) {
  if (isPlatformRoute(location.pathname)) {
    if (platformSession.isAuthenticated) {
      return {
        type: "platform",
        session: platformSession,
      };
    }

    return {
      type: "storefront",
      session: storefrontSession,
    };
  }

  if (shouldPreferStorefrontSession(location)) {
    if (storefrontSession.isAuthenticated) {
      return {
        type: "storefront",
        session: storefrontSession,
      };
    }

    return {
      type: "platform",
      session: platformSession,
    };
  }

  if (platformSession.isAuthenticated) {
    return {
      type: "platform",
      session: platformSession,
    };
  }

  return {
    type: "storefront",
    session: storefrontSession,
  };
}

export default function useAuth() {
  const location = useLocation();
  const platformSession = useAuthStore((state) => state.platformSession);
  const rawStorefrontSession = useAuthStore((state) => state.storefrontSession);
  const storefrontSessions = useAuthStore((state) => state.storefrontSessions);
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);
  const clearPlatformSession = useAuthStore(
    (state) => state.clearPlatformSession,
  );
  const setStorefrontSession = useAuthStore(
    (state) => state.setStorefrontSession,
  );
  const clearStorefrontSession = useAuthStore(
    (state) => state.clearStorefrontSession,
  );
  const clearAllSessions = useAuthStore((state) => state.clearAllSessions);
  const { storefrontSession, storefrontScope } = resolveScopedStorefrontSession(
    location,
    rawStorefrontSession,
    storefrontSessions,
  );
  const activeSession = resolveActiveSession(
    location,
    platformSession,
    storefrontSession,
  );
  const token = activeSession.session.token;
  const user = activeSession.session.user;
  const role = activeSession.session.role;
  const isAuthenticated = activeSession.session.isAuthenticated;
  const storefrontRole =
    storefrontSession.role || storefrontSession.user?.accountType;
  const platformRole =
    platformSession.role || platformSession.user?.accountType;
  const storefrontCustomer = extractStorefrontCustomer(
    storefrontSession.user,
    storefrontSession.token,
  );
  const isStoreCustomer = Boolean(storefrontCustomer);
  const isGuestSession = false;
  const hasStorefrontCustomerSession = isStoreCustomer;
  const isPlatformUser =
    isSuperAdminRole(platformRole) ||
    isOwnerRole(platformRole) ||
    isSuperAdminRole(platformSession.user?.accountType) ||
    isOwnerRole(platformSession.user?.accountType);
  const storeCustomer = isStoreCustomer ? storefrontCustomer : null;
  const guestStoreCustomer = null;
  const platformUser = isPlatformUser ? platformSession.user : null;

  return {
    authContext: activeSession.type,
    token,
    user,
    role,
    isAuthenticated,
    platformSession,
    storefrontSessions,
    storefrontSession,
    storefrontScope,
    platformToken: platformSession.token,
    platformRole,
    platformUser,
    isPlatformAuthenticated: platformSession.isAuthenticated && isPlatformUser,
    storefrontToken: storefrontSession.token,
    storefrontRole,
    storefrontUser: storefrontSession.user,
    storefrontCustomer,
    storeCustomer,
    guestStoreCustomer,
    isStoreCustomer,
    isGuestSession,
    hasStorefrontCustomerSession,
    isPlatformUser,
    setPlatformSession,
    clearPlatformSession,
    setStorefrontSession,
    clearStorefrontSession,
    clearAllSessions,
    setSession:
      activeSession.type === "storefront"
        ? setStorefrontSession
        : setPlatformSession,
    clearSession:
      activeSession.type === "storefront"
        ? clearStorefrontSession
        : clearPlatformSession,
  };
}
