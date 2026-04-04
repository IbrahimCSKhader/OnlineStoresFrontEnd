import useAuthStore from "../../store/authStore.js";
import {
  isOwnerRole,
  isStoreCustomerRole,
  isSuperAdminRole,
} from "../../utils/roles.js";

export default function useAuth() {
  const { token, user, role, isAuthenticated, setSession, clearSession } = useAuthStore();
  const isStoreCustomer = isStoreCustomerRole(role) || isStoreCustomerRole(user?.accountType);
  const isPlatformUser =
    isSuperAdminRole(role) ||
    isOwnerRole(role) ||
    isSuperAdminRole(user?.accountType) ||
    isOwnerRole(user?.accountType);

  return {
    token,
    user,
    role,
    isAuthenticated,
    isStoreCustomer,
    isPlatformUser,
    setSession,
    clearSession,
  };
}
