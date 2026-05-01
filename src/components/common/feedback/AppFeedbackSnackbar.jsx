import { useEffect } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import Paper from "@mui/material/Paper";
import Portal from "@mui/material/Portal";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";

const FEEDBACK_ICONS = {
  error: ErrorOutlineRoundedIcon,
  success: CheckRoundedIcon,
};

export default function AppFeedbackSnackbar({ toast, onClose }) {
  const theme = useTheme();
  const severity = toast?.severity || "success";
  const AccentIcon = FEEDBACK_ICONS[severity] || CheckRoundedIcon;
  const accentColor =
    severity === "error"
      ? theme.palette.error.main
      : severity === "warning"
        ? theme.palette.warning.main
        : theme.palette.primary.main;

  useEffect(() => {
    if (!toast?.open) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onClose?.();
    }, toast?.duration ?? 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast?.duration, toast?.id, toast?.open, onClose]);

  if (!toast?.open || !toast?.message) {
    return null;
  }

  return (
    <Portal>
      <Box
        sx={{
          position: "fixed",
          insetInline: 0,
          bottom: { xs: 18, sm: 24 },
          px: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: { xs: "center", sm: "flex-end" },
          zIndex: (currentTheme) => currentTheme.zIndex.snackbar ?? 1400,
          pointerEvents: "none",
        }}
      >
        <Fade in key={toast?.id || toast?.message} timeout={{ enter: 180, exit: 120 }}>
          <Paper
            elevation={0}
            sx={{
              pointerEvents: "auto",
              display: "inline-flex",
              alignItems: "center",
              maxWidth: "min(92vw, 360px)",
              py: 0.9,
              px: 1.1,
              borderRadius: "999px",
              border: `1px solid ${alpha(accentColor, 0.2)}`,
              backgroundColor: alpha(accentColor, 0.1),
              boxShadow: `0 16px 36px ${alpha(accentColor, 0.16)}`,
              backdropFilter: "blur(14px)",
            }}
          >
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color: theme.palette.getContrastText(accentColor),
                  backgroundColor: accentColor,
                }}
              >
                <AccentIcon sx={{ fontSize: 17 }} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  lineHeight: 1.35,
                }}
              >
                {toast.message}
              </Typography>
            </Stack>
          </Paper>
        </Fade>
      </Box>
    </Portal>
  );
}
