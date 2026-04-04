import useAuthStore from "../../store/authStore.js";
import {
  isGuestRole,
  isOwnerRole,
  isStoreCustomerRole,
  isSuperAdminRole,
} from "../../utils/roles.js";

export default function useAuth() {
  const { token, user, role, isAuthenticated, setSession, clearSession } = useAuthStore();
  const isStoreCustomer = isStoreCustomerRole(role) || isStoreCustomerRole(user?.accountType);
  const isGuestSession = isGuestRole(role) || isGuestRole(user?.accountType);
  const hasStorefrontCustomerSession = isStoreCustomer || isGuestSession;
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
    isGuestSession,
    hasStorefrontCustomerSession,
    isPlatformUser,
    setSession,
    clearSession,
  };
}
