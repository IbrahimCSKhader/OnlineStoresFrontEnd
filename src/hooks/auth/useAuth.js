import useAuthStore from "../../store/authStore.js";

export default function useAuth() {
  const { token, user, role, isAuthenticated, setSession, clearSession } = useAuthStore();

  return {
    token,
    user,
    role,
    isAuthenticated,
    setSession,
    clearSession,
  };
}
