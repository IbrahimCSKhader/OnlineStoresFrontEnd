import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMergeGuestCart from "../../hooks/cart/useMergeGuestCart.js";
import useAuthStore from "../../store/authStore.js";
import {
  logAuthFlow,
  serializeAuthFlowError,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";
import { extractRole, extractUser } from "../../utils/authSession.js";
import {
  clearPendingGoogleAuthContext,
  getPendingGoogleAuthContext,
  isStoreScopedPendingGoogleAuthContext,
} from "../../utils/pendingGoogleAuthContext.js";
import {
  clearPendingStoreGoogleAuth,
  setPendingStoreGoogleAuth,
} from "../../utils/pendingStoreGoogleAuth.js";
import {
  applyRequestedStoreScopeFallback,
  buildStoreCustomerAuthState,
  resolveStoreScopedAuthResult,
} from "../../utils/storeCustomerAuth.js";
import {
  clearPlatformAuthSession,
  getPlatformAuthToken,
  getStoredPlatformRole,
  getStoredPlatformUser,
  getStoredStorefrontRole,
  getStoredStorefrontUser,
  getStorefrontAuthToken,
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
  setStorefrontAuthToken,
  setStoredStorefrontRole,
  setStoredStorefrontUser,
} from "../../utils/token.js";

const DEFAULT_REDIRECT_PATH = "/";
const GOOGLE_FAILURE_PATH = "/auth/google/failure";

function readHashParams(hash) {
  if (!hash) return new URLSearchParams();

  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const queryPartIndex = normalizedHash.indexOf("?");
  const queryText =
    queryPartIndex >= 0
      ? normalizedHash.slice(queryPartIndex + 1)
      : normalizedHash;

  return new URLSearchParams(queryText);
}

function isSafeInternalRedirect(path) {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/auth/google")
  );
}

function replaceCallbackHistory(pathname) {
  window.history.replaceState(window.history.state, document.title, pathname);
}

function resolveGoogleStoreAuthResult({ token, user, role, requestedStoreId }) {
  return applyRequestedStoreScopeFallback(
    resolveStoreScopedAuthResult({ token, user, role }, requestedStoreId),
    requestedStoreId,
  );
}

function GoogleCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mergeGuestCart = useMergeGuestCart();
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);
  const setStorefrontSession = useAuthStore(
    (state) => state.setStorefrontSession,
  );
  const clearPlatformSession = useAuthStore(
    (state) => state.clearPlatformSession,
  );
  const hasHandledCallbackRef = useRef(false);

  useEffect(() => {
    if (hasHandledCallbackRef.current) {
      return;
    }

    hasHandledCallbackRef.current = true;

    async function handleCallback() {
      const clearPendingGoogleArtifacts = () => {
        clearPendingStoreGoogleAuth();
        clearPendingGoogleAuthContext();
      };

      const persistPlatformSession = ({ token, user, role }) => {
        if (token) {
          setPlatformAuthToken(token);
        }

        if (user) {
          setStoredPlatformUser(user);
        }

        if (role) {
          setStoredPlatformRole(role);
        }

        setPlatformSession({ token, user, role });
      };

      const persistStorefrontSession = ({ token, user, role }) => {
        if (token) {
          setStorefrontAuthToken(token);
        }

        if (user) {
          setStoredStorefrontUser(user);
        }

        if (role) {
          setStoredStorefrontRole(role);
        }

        setStorefrontSession({ token, user, role });
      };

      const searchParams = new URLSearchParams(location.search);
      const hashParams = readHashParams(location.hash);
      const pendingGoogleContext = getPendingGoogleAuthContext();
      const callbackStoreId =
        hashParams.get("storeId") || searchParams.get("storeId") || "";
      const callbackStoreSlug =
        hashParams.get("storeSlug") || searchParams.get("storeSlug") || "";
      const callbackStoreName =
        hashParams.get("storeName") || searchParams.get("storeName") || "";
      const effectiveStoreId = callbackStoreId || pendingGoogleContext?.storeId || "";
      const effectiveStoreSlug =
        callbackStoreSlug || pendingGoogleContext?.storeSlug || "";
      const effectiveStoreName =
        callbackStoreName || pendingGoogleContext?.storeName || "";
      const callbackStoreRedirect = effectiveStoreSlug
        ? `/market/${effectiveStoreSlug}`
        : "";
      const token = hashParams.get("token") || searchParams.get("token") || "";
      const error = hashParams.get("error") || searchParams.get("error");
      const redirectCandidate =
        hashParams.get("redirectTo") ||
        hashParams.get("redirect") ||
        hashParams.get("returnUrl") ||
        searchParams.get("redirectTo") ||
        searchParams.get("redirect") ||
        searchParams.get("returnUrl") ||
        pendingGoogleContext?.redirectTo ||
        callbackStoreRedirect ||
        location.state?.redirectTo ||
        "";
      const redirectPath = isSafeInternalRedirect(redirectCandidate)
        ? redirectCandidate
        : callbackStoreRedirect || DEFAULT_REDIRECT_PATH;
      const hasStoreGoogleContext =
        Boolean(callbackStoreId || callbackStoreSlug) ||
        isStoreScopedPendingGoogleAuthContext(pendingGoogleContext);

      if (error) {
        logAuthFlow("Google callback returned error", {
          error,
          storeId: effectiveStoreId,
          storeSlug: effectiveStoreSlug,
        });
        clearPendingGoogleArtifacts();
        replaceCallbackHistory(location.pathname);
        navigate(`${GOOGLE_FAILURE_PATH}?message=${encodeURIComponent(error)}`, {
          replace: true,
        });
        return;
      }

      if (!token) {
        const currentAuthState = useAuthStore.getState();
        const persistedPlatformSession = {
          token:
            currentAuthState?.platformSession?.token || getPlatformAuthToken(),
          user:
            currentAuthState?.platformSession?.user || getStoredPlatformUser(),
          role:
            currentAuthState?.platformSession?.role || getStoredPlatformRole(),
        };
        const persistedStorefrontSession = {
          token:
            currentAuthState?.storefrontSession?.token ||
            getStorefrontAuthToken(),
          user:
            currentAuthState?.storefrontSession?.user ||
            getStoredStorefrontUser(),
          role:
            currentAuthState?.storefrontSession?.role ||
            getStoredStorefrontRole(),
        };
        const persistedSession =
          hasStoreGoogleContext && persistedStorefrontSession.token
            ? {
                type: "storefront",
                ...persistedStorefrontSession,
              }
            : persistedPlatformSession.token
              ? {
                  type: "platform",
                  ...persistedPlatformSession,
                }
              : persistedStorefrontSession.token
                ? {
                    type: "storefront",
                    ...persistedStorefrontSession,
                  }
                : null;

        if (persistedSession?.token) {
          const persistedUser =
            persistedSession.user || extractUser({}, persistedSession.token);
          const persistedRole =
            persistedSession.role ||
            extractRole({}, persistedSession.token, persistedUser);

          if (persistedSession.type === "platform") {
            setPlatformSession({
              token: persistedSession.token,
              user: persistedUser,
              role: persistedRole,
            });
          } else {
            setStorefrontSession({
              token: persistedSession.token,
              user: persistedUser,
              role: persistedRole,
            });
          }

          clearPendingGoogleArtifacts();
          replaceCallbackHistory(location.pathname);
          navigate(
            hasStoreGoogleContext && persistedSession.type === "platform"
              ? "/owner"
              : redirectPath,
            { replace: true },
          );
          return;
        }

        clearPendingGoogleArtifacts();
        replaceCallbackHistory(location.pathname);
        navigate(`${GOOGLE_FAILURE_PATH}?message=missing_token`, {
          replace: true,
        });
        return;
      }

      const user = extractUser({}, token);
      const role = extractRole({}, token, user);

      if (hasStoreGoogleContext) {
        const authResult = resolveGoogleStoreAuthResult({
          token,
          user,
          role,
          requestedStoreId: effectiveStoreId,
        });

        logAuthFlow("Google callback classified store result", {
          storeId: effectiveStoreId,
          storeSlug: effectiveStoreSlug,
          redirectTo: redirectPath,
          responseStoreId: authResult.responseStoreId,
          responseStoreCustomerId: authResult.responseStoreCustomerId,
          isOwner: authResult.isOwner,
          isCustomer: authResult.isCustomer,
          belongsToRequestedStore: authResult.belongsToRequestedStore,
          role: authResult.role,
          user: serializeAuthFlowUser(authResult.user),
        });

        if (authResult.isOwner) {
          clearPendingGoogleArtifacts();
          persistPlatformSession({
            token,
            user: authResult.user,
            role: authResult.role,
          });
          replaceCallbackHistory(location.pathname);
          navigate("/owner", { replace: true });
          return;
        }

        if (authResult.isCustomer && authResult.belongsToRequestedStore) {
          clearPendingGoogleArtifacts();
          persistStorefrontSession({
            token,
            user: authResult.user,
            role: authResult.role,
          });
          await mergeGuestCart();
          replaceCallbackHistory(location.pathname);
          navigate(redirectPath, { replace: true });
          return;
        }

        if (authResult.isCustomer && effectiveStoreId) {
          logAuthFlow("Google callback rejected mismatched store session", {
            requestedStoreId: effectiveStoreId,
            responseStoreId: authResult.responseStoreId,
            role: authResult.role,
            user: serializeAuthFlowUser(authResult.user),
          });
          clearPendingGoogleArtifacts();
          replaceCallbackHistory(location.pathname);
          navigate(`${GOOGLE_FAILURE_PATH}?message=store_scope_mismatch`, {
            replace: true,
          });
          return;
        }

        const storeAuthState = buildStoreCustomerAuthState({
          storeId: effectiveStoreId,
          storeSlug: effectiveStoreSlug,
          storeName: effectiveStoreName,
          redirectTo: redirectPath,
        });
        const storeLoginPath = storeAuthState.storeSlug
          ? `/market/${storeAuthState.storeSlug}/login`
          : "/auth/login";

        setPendingStoreGoogleAuth({
          appUserToken: token,
          email: user?.email || "",
          storeId: storeAuthState.storeId,
          storeSlug: storeAuthState.storeSlug,
          storeName: storeAuthState.storeName,
          redirectTo: storeAuthState.redirectTo,
        });
        clearPendingGoogleAuthContext();

        logAuthFlow("Google callback requires store setup", {
          storeId: storeAuthState.storeId,
          storeSlug: storeAuthState.storeSlug,
          redirectTo: storeAuthState.redirectTo,
          email: user?.email || "",
          role,
          user: serializeAuthFlowUser(user),
        });

        replaceCallbackHistory(location.pathname);
        navigate(storeLoginPath, {
          replace: true,
          state: {
            ...storeAuthState,
            googleStoreAuthPending: true,
          },
        });
        return;
      }

      clearPendingGoogleArtifacts();

      try {
        persistPlatformSession({ token, user, role });
      } catch {
        clearPlatformAuthSession();
        clearPlatformSession();
        replaceCallbackHistory(location.pathname);
        navigate(`${GOOGLE_FAILURE_PATH}?message=invalid_token`, {
          replace: true,
        });
        return;
      }

      logAuthFlow("Google callback created platform session", {
        redirectTo: redirectPath,
        role,
        user: serializeAuthFlowUser(user),
      });

      replaceCallbackHistory(location.pathname);
      navigate(redirectPath, { replace: true });
    }

    void handleCallback().catch((error) => {
      logAuthFlow("Google callback processing failed", {
        error: serializeAuthFlowError(error),
      });
      clearPendingStoreGoogleAuth();
      clearPendingGoogleAuthContext();
      replaceCallbackHistory(location.pathname);
      navigate(`${GOOGLE_FAILURE_PATH}?message=processing_failed`, {
        replace: true,
      });
    });
  }, [
    clearPlatformSession,
    location.hash,
    location.pathname,
    location.search,
    location.state,
    mergeGuestCart,
    navigate,
    setPlatformSession,
    setStorefrontSession,
  ]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 2,
      }}
    >
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          ط¬ط§ط±ظچ ط¥ظƒظ…ط§ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¹ط¨ط± Google...
        </Typography>
      </Stack>
    </Box>
  );
}

export default GoogleCallbackPage;
