import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useAuth from "../../hooks/auth/useAuth.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractUser } from "../../utils/authSession.js";
import { getLandingPath } from "../../utils/roles.js";
import { setAuthToken, setStoredAuthRole, setStoredAuthUser } from "../../utils/token.js";

function buildGoogleFailurePath(message) {
  return `/auth/google/failure?message=${encodeURIComponent(message)}`;
}

function parseGoogleSuccessHash(hash) {
  try {
    const normalizedHash = String(hash || "").replace(/^#/, "");
    const params = new URLSearchParams(normalizedHash);

    return {
      token: params.get("token")?.trim() || "",
      email: params.get("email")?.trim() || "",
      firstName: params.get("firstName")?.trim() || "",
      lastName: params.get("lastName")?.trim() || "",
    };
  } catch {
    return null;
  }
}

export default function GoogleSuccessCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useAuth();
  const setSession = useAuthStore((state) => state.setSession);
  const effectiveRole = role || user?.accountType || "";

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    try {
      const parsedHash = parseGoogleSuccessHash(window.location.hash);

      if (!parsedHash) {
        navigate(buildGoogleFailurePath("invalid_hash"), { replace: true });
        return;
      }

      if (!parsedHash.token) {
        navigate(buildGoogleFailurePath("missing_token"), { replace: true });
        return;
      }

      const authPayload = {
        token: parsedHash.token,
        email: parsedHash.email,
        firstName: parsedHash.firstName,
        lastName: parsedHash.lastName,
      };
      const resolvedUser = extractUser(authPayload, parsedHash.token);
      const resolvedRole = extractRole(authPayload, parsedHash.token, resolvedUser);

      setAuthToken(parsedHash.token);
      setStoredAuthUser(resolvedUser);
      setStoredAuthRole(resolvedRole);
      setSession({
        token: parsedHash.token,
        user: resolvedUser,
        role: resolvedRole,
      });

      try {
        window.history.replaceState(
          window.history.state,
          document.title,
          `${window.location.pathname}${window.location.search}`,
        );
      } catch {
        // Best-effort URL cleanup; auth session is already persisted.
      }

      navigate(getLandingPath(resolvedRole || resolvedUser?.accountType || ""), {
        replace: true,
      });
    } catch {
      navigate(buildGoogleFailurePath("processing_failed"), { replace: true });
    }
  }, [isAuthenticated, navigate, setSession]);

  if (isAuthenticated) {
    return <Navigate to={getLandingPath(effectiveRole)} replace />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "background.default",
        padding: 2,
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
