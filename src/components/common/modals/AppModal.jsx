import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";

export default function AppModal({ children, PaperProps, ...props }) {
  return (
    <Dialog
      {...props}
      PaperProps={{
        ...PaperProps,
        className: ["app-modal__paper", PaperProps?.className || ""]
          .filter(Boolean)
          .join(" "),
      }}
    >
      <DialogContent sx={{ p: 0 }}>{children}</DialogContent>
    </Dialog>
  );
}
