import useAuth from "./useAuth.js";
import {
  ensureStorefrontGuestSession,
  getStorefrontSessionState,
} from "../../utils/storefrontSession.js";

export default function useStorefrontSession(storeId, storeSlug = "") {
  const auth = useAuth();
  const sessionState = getStorefrontSessionState(storeId, storeSlug, auth);

  return {
    ...sessionState,
    ensureStorefrontSession: () =>
      ensureStorefrontGuestSession(storeId, storeSlug),
  };
}
