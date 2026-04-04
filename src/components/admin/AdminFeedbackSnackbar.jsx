import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

export default function AdminFeedbackSnackbar({ toast, onClose }) {
  return (
    <Snackbar
      open={Boolean(toast?.open)}
      autoHideDuration={4200}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={toast?.severity || "success"}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {toast?.message || ""}
      </Alert>
    </Snackbar>
  );
}
