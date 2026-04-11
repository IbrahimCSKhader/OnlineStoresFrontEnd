import { create } from "zustand";
import { isGuestRole } from "../utils/roles.js";
import {
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

const storedPlatformUser = getStoredPlatformUser();
const storedPlatformRole = getStoredPlatformRole();
const storedStorefrontUser = getStoredStorefrontUser();
const storedStorefrontRole = getStoredStorefrontRole();
const shouldDiscardGuestStorefrontSession =
  isGuestRole(storedStorefrontRole) || isGuestRole(storedStorefrontUser?.accountType);

if (shouldDiscardGuestStorefrontSession) {
  clearStorefrontAuthSession();
}

const initialPlatformSession = {
  token: getPlatformAuthToken(),
  user: storedPlatformUser,
  role: storedPlatformRole,
  isAuthenticated: Boolean(getPlatformAuthToken()),
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
