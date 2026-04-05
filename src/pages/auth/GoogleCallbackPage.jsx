import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractUser } from "../../utils/authSession.js";
import {
  clearAuthSession,
  getAuthToken,
  getStoredAuthRole,
  getStoredAuthUser,
  setAuthToken,
  setStoredAuthRole,
  setStoredAuthUser,
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

function GoogleCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const hasHandledCallbackRef = useRef(false);

  useEffect(() => {
    if (hasHandledCallbackRef.current) {
      return;
    }

    hasHandledCallbackRef.current = true;

    const searchParams = new URLSearchParams(location.search);
    const hashParams = readHashParams(location.hash);
    const token = hashParams.get("token") || searchParams.get("token") || "";
    const error = hashParams.get("error") || searchParams.get("error");
    const redirectCandidate =
      hashParams.get("redirectTo") ||
      hashParams.get("redirect") ||
      hashParams.get("returnUrl") ||
      searchParams.get("redirectTo") ||
      searchParams.get("redirect") ||
      searchParams.get("returnUrl") ||
      location.state?.redirectTo ||
      "";
    const redirectPath = isSafeInternalRedirect(redirectCandidate)
      ? redirectCandidate
      : DEFAULT_REDIRECT_PATH;

    if (error) {
      navigate(`${GOOGLE_FAILURE_PATH}?message=${encodeURIComponent(error)}`, {
        replace: true,
      });
      return;
    }

    if (!token) {
      // In React StrictMode, callback effects may execute more than once.
      // Rehydrate from persisted auth session to keep Zustand/UI in sync.
      const currentAuthState = useAuthStore.getState();
      const persistedToken = currentAuthState?.token || getAuthToken();

      if (persistedToken) {
        const persistedUser =
          currentAuthState?.user ||
          getStoredAuthUser() ||
          extractUser({}, persistedToken);
        const persistedRole =
          currentAuthState?.role ||
          getStoredAuthRole() ||
          extractRole({}, persistedToken, persistedUser);

        setSession({
          token: persistedToken,
          user: persistedUser,
          role: persistedRole,
        });

        window.history.replaceState(
          window.history.state,
          document.title,
          location.pathname,
        );
        navigate(redirectPath, { replace: true });
        return;
      }

      navigate(`${GOOGLE_FAILURE_PATH}?message=missing_token`, {
        replace: true,
      });
      return;
    }

    const user = extractUser({}, token);
    const role = extractRole({}, token, user);

    setAuthToken(token);

    if (user) {
      setStoredAuthUser(user);
    }

    if (role) {
      setStoredAuthRole(role);
    }

    try {
      setSession({ token, user, role });
    } catch {
      clearAuthSession();
      setSession({ token: "", user: null, role: "" });
      navigate(`${GOOGLE_FAILURE_PATH}?message=invalid_token`, {
        replace: true,
      });
      return;
    }

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
    setSession,
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
