import { create } from "zustand";
import { isGuestRole } from "../utils/roles.js";
import {
  clearAuthSession,
  getAuthToken,
  getStoredAuthRole,
  getStoredAuthUser,
} from "../utils/token.js";

const storedUser = getStoredAuthUser();
const storedRole = getStoredAuthRole();
const shouldDiscardGuestSession =
  isGuestRole(storedRole) || isGuestRole(storedUser?.accountType);

if (shouldDiscardGuestSession) {
  clearAuthSession();
}

const token = shouldDiscardGuestSession ? "" : getAuthToken();
const initialState = {
  token,
  user: shouldDiscardGuestSession ? null : storedUser,
  role: shouldDiscardGuestSession ? "" : storedRole,
  isAuthenticated: Boolean(token),
};

const useAuthStore = create((set) => ({
  ...initialState,
  setSession: ({ token, user, role }) =>
    set({
      token: token ?? "",
      user: user ?? null,
      role: role ?? "",
      isAuthenticated: Boolean(token),
    }),
  clearSession: () =>
    set({
      token: "",
      user: null,
      role: "",
      isAuthenticated: false,
    }),
}));

export default useAuthStore;
