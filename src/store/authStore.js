import { create } from "zustand";
import { getAuthToken, getStoredAuthRole, getStoredAuthUser } from "../utils/token.js";

const token = getAuthToken();
const initialState = {
  token,
  user: getStoredAuthUser(),
  role: getStoredAuthRole(),
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
