import useAuthStore from "../../store/authStore.js";
import { extractStorefrontCustomer } from "../../utils/authSession.js";
import {
  isOwnerRole,
  isStoreCustomerRole,
  isSuperAdminRole,
} from "../../utils/roles.js";

export default function useAuth() {
  const { token, user, role, isAuthenticated, setSession, clearSession } = useAuthStore();
  const isStoreCustomer = isStoreCustomerRole(role) || isStoreCustomerRole(user?.accountType);
  const isGuestSession = false;
  const hasStorefrontCustomerSession = isStoreCustomer;
  const isPlatformUser =
    isSuperAdminRole(role) ||
    isOwnerRole(role) ||
    isSuperAdminRole(user?.accountType) ||
    isOwnerRole(user?.accountType);
  const storefrontCustomer = hasStorefrontCustomerSession
    ? extractStorefrontCustomer(user)
    : null;
  const storeCustomer = isStoreCustomer ? storefrontCustomer : null;
  const guestStoreCustomer = null;
  const platformUser = isPlatformUser ? user : null;

  return {
    token,
    user,
    storefrontCustomer,
    storeCustomer,
    guestStoreCustomer,
    platformUser,
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
