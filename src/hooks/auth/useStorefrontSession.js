import useAuth from "./useAuth.js";
import {
  ensureStorefrontGuestSession,
  getStorefrontSessionState,
} from "../../utils/storefrontSession.js";

export default function useStorefrontSession(storeId) {
  const auth = useAuth();
  const sessionState = getStorefrontSessionState(storeId, auth);

  return {
    ...sessionState,
    ensureStorefrontSession: () => ensureStorefrontGuestSession(storeId),
  };
}
