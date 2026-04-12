import { matchPath, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";
import { extractStorefrontCustomer } from "../../utils/authSession.js";
import {
  isOwnerRole,
  isStoreCustomerRole,
  isSuperAdminRole,
} from "../../utils/roles.js";
import { STORE_CUSTOMER_AUTH_MODE } from "../../utils/storeCustomerAuth.js";

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

  return (
    location.pathname.startsWith("/auth/") &&
    location.state?.authMode === STORE_CUSTOMER_AUTH_MODE
  );
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
  const storefrontSession = useAuthStore((state) => state.storefrontSession);
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
  const storefrontCustomer = extractStorefrontCustomer(storefrontSession.user);
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
    storefrontSession,
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
