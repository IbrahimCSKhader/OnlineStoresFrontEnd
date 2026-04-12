import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractUser } from "../../utils/authSession.js";
import {
  clearPendingStoreGoogleAuth,
  setPendingStoreGoogleAuth,
} from "../../utils/pendingStoreGoogleAuth.js";
import {
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
const GOOGLE_REDIRECT_FALLBACK_KEY = "googleAuthRedirectFallback";

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

function readPendingGoogleRedirectPath() {
  try {
    return window.sessionStorage.getItem(GOOGLE_REDIRECT_FALLBACK_KEY) || "";
  } catch {
    return "";
  }
}

function clearPendingGoogleRedirectPath() {
  try {
    window.sessionStorage.removeItem(GOOGLE_REDIRECT_FALLBACK_KEY);
  } catch {
    // ignore storage access errors
  }
}

function GoogleCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
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

    const searchParams = new URLSearchParams(location.search);
    const hashParams = readHashParams(location.hash);
    const pendingRedirect = readPendingGoogleRedirectPath();
    const callbackStoreId =
      hashParams.get("storeId") || searchParams.get("storeId") || "";
    const callbackStoreSlug =
      hashParams.get("storeSlug") || searchParams.get("storeSlug") || "";
    const callbackStoreName =
      hashParams.get("storeName") || searchParams.get("storeName") || "";
    const callbackStoreRedirect = callbackStoreSlug
      ? `/market/${callbackStoreSlug}`
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
      callbackStoreRedirect ||
      pendingRedirect ||
      location.state?.redirectTo ||
      "";
    const redirectPath = isSafeInternalRedirect(redirectCandidate)
      ? redirectCandidate
      : DEFAULT_REDIRECT_PATH;
    const hasStoreGoogleContext = Boolean(callbackStoreId || callbackStoreSlug);

    if (error) {
      clearPendingStoreGoogleAuth();
      clearPendingGoogleRedirectPath();
      navigate(`${GOOGLE_FAILURE_PATH}?message=${encodeURIComponent(error)}`, {
        replace: true,
      });
      return;
    }

    if (!token) {
      // In React StrictMode, callback effects may execute more than once.
      // Rehydrate from persisted auth session to keep Zustand/UI in sync.
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
      const persistedSession = persistedPlatformSession.token
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

        clearPendingStoreGoogleAuth();
        clearPendingGoogleRedirectPath();

        window.history.replaceState(
          window.history.state,
          document.title,
          location.pathname,
        );
        navigate(redirectPath, { replace: true });
        return;
      }

      clearPendingStoreGoogleAuth();
      clearPendingGoogleRedirectPath();
      navigate(`${GOOGLE_FAILURE_PATH}?message=missing_token`, {
        replace: true,
      });
      return;
    }

    const user = extractUser({}, token);
    const role = extractRole({}, token, user);

    if (hasStoreGoogleContext) {
      const authResult = resolveStoreScopedAuthResult(
        { token, user, role },
        callbackStoreId || "",
      );

      if (authResult.isOwner) {
        clearPendingStoreGoogleAuth();
        setPlatformAuthToken(token);

        if (authResult.user) {
          setStoredPlatformUser(authResult.user);
        }

        if (authResult.role) {
          setStoredPlatformRole(authResult.role);
        }

        setPlatformSession({
          token,
          user: authResult.user,
          role: authResult.role,
        });

        clearPendingGoogleRedirectPath();

        window.history.replaceState(
          window.history.state,
          document.title,
          location.pathname,
        );
        navigate("/owner", { replace: true });
        return;
      }

      if (authResult.isCustomer) {
        clearPendingStoreGoogleAuth();
        setStorefrontAuthToken(token);

        if (authResult.user) {
          setStoredStorefrontUser(authResult.user);
        }

        if (authResult.role) {
          setStoredStorefrontRole(authResult.role);
        }

        setStorefrontSession({
          token,
          user: authResult.user,
          role: authResult.role,
        });

        clearPendingGoogleRedirectPath();

        window.history.replaceState(
          window.history.state,
          document.title,
          location.pathname,
        );
        navigate(redirectPath, { replace: true });
        return;
      }

      const storeAuthState = buildStoreCustomerAuthState({
        storeId: callbackStoreId || "",
        storeSlug: callbackStoreSlug,
        storeName: callbackStoreName,
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
      clearPendingGoogleRedirectPath();

      window.history.replaceState(
        window.history.state,
        document.title,
        location.pathname,
      );
      navigate(storeLoginPath, {
        replace: true,
        state: {
          ...storeAuthState,
          googleStoreAuthPending: true,
        },
      });
      return;
    }

    clearPendingStoreGoogleAuth();
    setPlatformAuthToken(token);

    if (user) {
      setStoredPlatformUser(user);
    }

    if (role) {
      setStoredPlatformRole(role);
    }

    try {
      setPlatformSession({ token, user, role });
    } catch {
      clearPlatformAuthSession();
      clearPlatformSession();
      clearPendingGoogleRedirectPath();
      navigate(`${GOOGLE_FAILURE_PATH}?message=invalid_token`, {
        replace: true,
      });
      return;
    }

    clearPendingGoogleRedirectPath();

    window.history.replaceState(
      window.history.state,
      document.title,
      location.pathname,
    );
    navigate(redirectPath, { replace: true });
  }, [
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
    setPlatformSession,
    setStorefrontSession,
    clearPlatformSession,
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
          جارٍ إكمال تسجيل الدخول عبر Google...
        </Typography>
      </Stack>
    </Box>
  );
}

export default GoogleCallbackPage;
