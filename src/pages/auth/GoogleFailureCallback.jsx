import { useEffect } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { clearPendingGoogleCallbackResult } from "../../utils/pendingGoogleCallbackResult.js";
import { clearPendingGoogleAuthContext } from "../../utils/pendingGoogleAuthContext.js";
import { clearPendingStoreGoogleAuth } from "../../utils/pendingStoreGoogleAuth.js";

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
  store_scope_mismatch:
    "The returned Google account does not belong to the current store context.",
  server_error:
    "The server failed while processing the Google sign-in request.",
  temporarily_unavailable:
    "Google sign-in is temporarily unavailable.",
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
            to="/auth/login"
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
