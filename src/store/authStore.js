import { create } from "zustand";
import { isGuestRole, isStoreCustomerRole } from "../utils/roles.js";
import { extractStorefrontCustomer } from "../utils/authSession.js";
import {
  clearPlatformAuthSession,
  clearStorefrontAuthSession,
  getPlatformAuthToken,
  getStoredPlatformRole,
  getStoredPlatformUser,
  getStoredStorefrontRole,
  getStoredStorefrontUser,
  getStorefrontAuthToken,
  migrateLegacyAuthSession,
} from "../utils/token.js";

migrateLegacyAuthSession();

const storedPlatformToken = getPlatformAuthToken();
const storedPlatformUser = getStoredPlatformUser();
const storedPlatformRole = getStoredPlatformRole();
const storedStorefrontUser = getStoredStorefrontUser();
const storedStorefrontRole = getStoredStorefrontRole();
const storedPlatformStorefrontCustomer = extractStorefrontCustomer(
  storedPlatformUser,
  storedPlatformToken,
);
const storedStorefrontCustomer =
  extractStorefrontCustomer(storedStorefrontUser);
const shouldDiscardStorefrontScopedPlatformSession =
  Boolean(storedPlatformStorefrontCustomer) ||
  isStoreCustomerRole(storedPlatformRole) ||
  isStoreCustomerRole(storedPlatformUser?.accountType);
const shouldDiscardGuestStorefrontSession =
  !storedStorefrontCustomer &&
  (isGuestRole(storedStorefrontRole) ||
    isGuestRole(storedStorefrontUser?.accountType));

if (shouldDiscardStorefrontScopedPlatformSession) {
  clearPlatformAuthSession();
}

if (shouldDiscardGuestStorefrontSession) {
  clearStorefrontAuthSession();
}

const initialPlatformSession = {
  token: shouldDiscardStorefrontScopedPlatformSession ? "" : storedPlatformToken,
  user: shouldDiscardStorefrontScopedPlatformSession ? null : storedPlatformUser,
  role: shouldDiscardStorefrontScopedPlatformSession ? "" : storedPlatformRole,
  isAuthenticated: Boolean(
    shouldDiscardStorefrontScopedPlatformSession ? "" : storedPlatformToken,
  ),
};

const storefrontToken = shouldDiscardGuestStorefrontSession
  ? ""
  : getStorefrontAuthToken();
const initialState = {
  platformSession: initialPlatformSession,
  storefrontSession: {
    token: storefrontToken,
    user: shouldDiscardGuestStorefrontSession ? null : storedStorefrontUser,
    role: shouldDiscardGuestStorefrontSession ? "" : storedStorefrontRole,
    isAuthenticated: Boolean(storefrontToken),
  },
};

const useAuthStore = create((set) => ({
  ...initialState,
  setPlatformSession: ({ token, user, role }) =>
    set({
      platformSession: {
        token: token ?? "",
        user: user ?? null,
        role: role ?? "",
        isAuthenticated: Boolean(token),
      },
    }),
  clearPlatformSession: () =>
    set({
      platformSession: {
        token: "",
        user: null,
        role: "",
        isAuthenticated: false,
      },
    }),
  setStorefrontSession: ({ token, user, role }) =>
    set({
      storefrontSession: {
        token: token ?? "",
        user: user ?? null,
        role: role ?? "",
        isAuthenticated: Boolean(token),
      },
    }),
  clearStorefrontSession: () =>
    set({
      storefrontSession: {
        token: "",
        user: null,
        role: "",
        isAuthenticated: false,
      },
    }),
  clearAllSessions: () =>
    set({
      platformSession: {
        token: "",
        user: null,
        role: "",
        isAuthenticated: false,
      },
      storefrontSession: {
        token: "",
        user: null,
        role: "",
        isAuthenticated: false,
      },
    }),
}));

export default useAuthStore;
