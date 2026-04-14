import { useEffect } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { clearPendingGoogleCallbackResult } from "../../utils/pendingGoogleCallbackResult.js";
import {
  clearPendingGoogleAuthContext,
  getPendingGoogleAuthContext,
} from "../../utils/pendingGoogleAuthContext.js";
import { clearPendingStoreGoogleAuth } from "../../utils/pendingStoreGoogleAuth.js";
import { buildStoreCustomerAuthState } from "../../utils/storeCustomerAuth.js";
import { getPendingGoogleCallbackResult } from "../../utils/pendingGoogleCallbackResult.js";

const ERROR_MESSAGES = {
  missing_token:
    "Missing Google callback token. Please try signing in again.",
  invalid_hash:
    "Could not read the Google callback payload. Please try again.",
  invalid_token:
    "Unable to validate the Google callback token. Please try signing in again.",
  classification_impossible:
    "Google callback succeeded, but the frontend could not classify the token as platform or storefront.",
  processing_failed:
    "An error happened while finalizing Google sign-in. Please try again.",
  access_denied:
    "Google access was denied. Grant the required permissions and retry.",
  invalid_request:
    "The Google sign-in request was invalid or incomplete.",
  store_context_required:
    "Google sign-in must be started from a specific store page.",
  store_context_missing:
    "The store context was lost during the Google sign-in roundtrip.",
  store_scope_mismatch:
    "The returned Google account does not belong to the current store context.",
  google_auth_failed:
    "Google authentication could not be completed.",
  email_not_found:
    "Google did not return an email for this account.",
  store_invalid_or_missing:
    "The selected store is invalid, missing, or inactive.",
  owner_customer_conflict:
    "This email belongs to the store owner flow, not the storefront customer flow.",
  jwt_generation_failed:
    "The session token could not be created.",
  redirect_build_failed:
    "The Google redirect could not be completed.",
  server_error:
    "The server failed while processing the Google sign-in request.",
  temporarily_unavailable:
    "Google sign-in is temporarily unavailable.",
  unexpected_error:
    "An unexpected error happened during Google sign-in.",
  default:
    "Google sign-in could not be completed. Please try again from the login page.",
};

function resolveFailureMessage(searchParams) {
  const rawMessage = searchParams.get("message")?.trim();
  const errorCode = searchParams.get("error")?.trim();

  if (rawMessage && ERROR_MESSAGES[rawMessage]) {
    return ERROR_MESSAGES[rawMessage];
  }

  if (rawMessage) {
    return rawMessage;
  }

  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  return ERROR_MESSAGES.default;
}

export default function GoogleFailureCallback() {
  const [searchParams] = useSearchParams();
  const displayMessage = resolveFailureMessage(searchParams);
  const pendingGoogleContext = getPendingGoogleAuthContext();
  const pendingGoogleCallbackResult = getPendingGoogleCallbackResult();
  const retryStoreSlug =
    pendingGoogleContext?.storeSlug || pendingGoogleCallbackResult?.storeSlug || "";
  const retryStoreId =
    pendingGoogleContext?.storeId || pendingGoogleCallbackResult?.storeId || "";
  const retryPath = retryStoreSlug ? `/market/${retryStoreSlug}/login` : "/auth/login";
  const retryState =
    retryStoreSlug || retryStoreId
      ? buildStoreCustomerAuthState({
          storeId: retryStoreId,
          storeSlug: retryStoreSlug,
          storeName: pendingGoogleContext?.storeName || "",
          redirectTo: pendingGoogleContext?.redirectTo || "",
        })
      : undefined;

  useEffect(() => {
    clearPendingGoogleCallbackResult();
    clearPendingStoreGoogleAuth();
    clearPendingGoogleAuthContext();
  }, []);

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
      <Paper elevation={0} sx={{ maxWidth: 520, width: "100%" }}>
        <Stack spacing={3} sx={{ padding: 4 }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: "error.main" }}>
              Google sign-in could not be completed
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A valid authenticated session was not created. You can retry from the login page.
            </Typography>
          </Box>

          <Alert severity="error">{displayMessage}</Alert>

          <Button
            component={RouterLink}
            to={retryPath}
            state={retryState}
            variant="contained"
            size="large"
            fullWidth
          >
            Try again
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
