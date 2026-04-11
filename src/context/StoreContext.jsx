import { createContext, useContext, useMemo } from "react";
import useOwnerStore from "../hooks/stores/useOwnerStore.js";

/**
 * Store Context - Provides centralized store data and storeId
 * Ensures storeId is consistent across all pages and API calls
 * 
 * CRITICAL SECURITY RULE:
 * storeId (URL) === storeId (state/context)
 * Backend enforces ownership checks based on this
 */
const StoreContext = createContext({
  store: null,
  storeId: null,
  isLoading: false,
  error: null,
  isOwner: false,
});

export function useStoreContext() {
  const context = useContext(StoreContext);
  
  if (!context) {
    console.warn(
      "useStoreContext called outside StoreContextProvider. " +
      "Make sure this component is wrapped with <StoreContextProvider>"
    );
  }
  
  return context;
}

/**
 * Provider component for owner/storefront pages
 * Wraps owner dashboard and store-specific routes
 */
export function StoreContextProvider({ children, storeId: propStoreId }) {
  const ownerStoreQuery = useOwnerStore({ 
    refetchOnWindowFocus: false 
  });

  const value = useMemo(() => {
    const store = ownerStoreQuery.ownerStore;
    const storeId = propStoreId || store?.id;

    return {
      store,
      storeId,
      isLoading: ownerStoreQuery.isLoading,
      error: ownerStoreQuery.error,
      isOwner: Boolean(store),
    };
  }, [ownerStoreQuery, propStoreId]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

/**
 * Helper hook to ensure storeId exists
 * Throws error if storeId is missing (prevents IDOR vulnerabilities)
 */
export function useRequireStoreId() {
  const { storeId, isLoading } = useStoreContext();

  if (!isLoading && !storeId) {
    throw new Error(
      "StoreId is required but not found. " +
      "Make sure you have a valid store and proper authentication."
    );
  }

  return storeId;
}

export default StoreContext;
