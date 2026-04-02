import Paper from "@mui/material/Paper";

export default function SurfaceCard({
  children,
  variant = "default",
  interactive = false,
  className,
  ...props
}) {
  return (
    <Paper
      elevation={0}
      className={[
        "app-surface-card",
        variant !== "default" ? `app-surface-card--${variant}` : "",
        interactive ? "app-surface-card--interactive" : "",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Paper>
  );
}
