import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

export default function AppButton({
  children,
  loading = false,
  disabled,
  startIcon,
  endIcon,
  appearance,
  color,
  className,
  loadingLabel = "جارٍ التنفيذ...",
  variant = "contained",
  ...props
}) {
  const resolvedAppearance =
    appearance ||
    (color === "error" || color === "warning"
      ? "destructive"
      : variant === "contained"
        ? "primary"
        : variant === "outlined"
          ? "secondary"
          : "ghost");

  return (
    <Button
      variant={variant}
      color={color}
      disabled={disabled || loading}
      startIcon={loading ? null : startIcon}
      endIcon={loading ? null : endIcon}
      className={[
        "app-button",
        `app-button--${resolvedAppearance}`,
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
        <span className="app-button__spinner">
          <CircularProgress size={18} thickness={5} color="inherit" />
        </span>
      ) : null}
      <span>{loading ? loadingLabel : children}</span>
    </Button>
  );
}
