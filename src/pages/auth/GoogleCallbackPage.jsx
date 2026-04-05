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
  setAuthToken,
  setStoredAuthRole,
  setStoredAuthUser,
} from "../../utils/token.js";

const LOGIN_PATH = "/auth/login";
const DEFAULT_REDIRECT_PATH = "/";

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
    const token = searchParams.get("token") || hashParams.get("token") || "";
    const error = searchParams.get("error") || hashParams.get("error");
    const redirectCandidate =
      searchParams.get("redirectTo") ||
      searchParams.get("redirect") ||
      searchParams.get("returnUrl") ||
      location.state?.redirectTo ||
      "";
    const redirectPath = isSafeInternalRedirect(redirectCandidate)
      ? redirectCandidate
      : DEFAULT_REDIRECT_PATH;

    if (error) {
      navigate(LOGIN_PATH, { replace: true, state: { oauthError: "google" } });
      return;
    }

    if (!token) {
      navigate(LOGIN_PATH, {
        replace: true,
        state: { oauthError: "missing_token" },
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
      navigate(LOGIN_PATH, {
        replace: true,
        state: { oauthError: "invalid_token" },
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
