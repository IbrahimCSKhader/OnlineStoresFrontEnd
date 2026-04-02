import TextField from "@mui/material/TextField";

export default function AppTextField({ className, ...props }) {
  return (
    <TextField
      fullWidth
      className={["app-input", className || ""].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
