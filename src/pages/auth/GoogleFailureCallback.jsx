import { useEffect } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { clearPendingGoogleAuthContext } from "../../utils/pendingGoogleAuthContext.js";
import { clearPendingStoreGoogleAuth } from "../../utils/pendingStoreGoogleAuth.js";

const ERROR_MESSAGES = {
  missing_token:
    "ظ„ظ… ظٹطµظ„ ط±ظ…ط² ط§ظ„ط¬ظ„ط³ط© ظ…ظ† ط§ظ„ط®ط§ط¯ظ… ط¨ط¹ط¯ ط§ظ„ط¹ظˆط¯ط© ظ…ظ† Google. ط­ط§ظˆظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰.",
  invalid_hash: "طھط¹ط°ط± ظ‚ط±ط§ط،ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظˆط¯ط© ظ…ظ† Google. ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰.",
  processing_failed:
    "ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط¥ظƒظ…ط§ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¹ط¨ط± Google. ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰.",
  access_denied:
    "طھظ… ط±ظپط¶ ط§ظ„ظˆطµظˆظ„ ظ…ظ† Google. ط§ظ…ظ†ط­ ط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط© ط«ظ… ط£ط¹ط¯ ط§ظ„ظ…ط­ط§ظˆظ„ط©.",
  invalid_request: "ط·ظ„ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¹ط¨ط± Google ط؛ظٹط± طµط§ظ„ط­ ط£ظˆ ط؛ظٹط± ظ…ظƒطھظ…ظ„.",
  store_context_required:
    "ظٹظ„ط²ظ… ظپطھط­ طµظپط­ط© ظ…طھط¬ط± ظ…ط­ط¯ط¯ ظ‚ط¨ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¹ط¨ط± Google. ط§ط±ط¬ط¹ ط¥ظ„ظ‰ ط§ظ„ظ…طھط¬ط± ظˆط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰.",
  store_scope_mismatch:
    "ط§ظ„ط­ط³ط§ط¨ ط§ظ„ط¹ط§ط¦ط¯ ظ…ظ† Google ظ„ظٹط³ ظ…ط±طھط¨ط·ظ‹ط§ ط¨ط§ظ„ظ…طھط¬ط± ط§ظ„ط­ط§ظ„ظٹ. ط§ط¹ط¯ ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ…ظ† طµظپط­ط© ط§ظ„ظ…طھط¬ط± ط§ظ„طµط­ظٹط­ط©.",
  server_error: "ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط®ط§ط¯ظ… ط£ط«ظ†ط§ط، ظ…ط¹ط§ظ„ط¬ط© طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¹ط¨ط± Google.",
  temporarily_unavailable: "ط®ط¯ظ…ط© طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¹ط¨ط± Google ط؛ظٹط± ظ…طھط§ط­ط© ط­ط§ظ„ظٹظ‹ط§.",
  default: "ظپط´ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¹ط¨ط± Google. ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰ ظ…ظ† طµظپط­ط© طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„.",
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
              طھط¹ط°ط± ط¥ظƒظ…ط§ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¹ط¨ط± Google
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ظ„ظ… ظٹطھظ… ط¥ظ†ط´ط§ط، ط¬ظ„ط³ط© ط¯ط®ظˆظ„ طµط§ظ„ط­ط©. ظٹظ…ظƒظ†ظƒ ط¥ط¹ط§ط¯ط© ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ…ظ† طµظپط­ط© طھط³ط¬ظٹظ„
              ط§ظ„ط¯ط®ظˆظ„.
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
            ط¥ط¹ط§ط¯ط© ط§ظ„ظ…ط­ط§ظˆظ„ط©
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
