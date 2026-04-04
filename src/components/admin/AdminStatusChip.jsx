import Chip from "@mui/material/Chip";

export default function AdminStatusChip({
  active,
  activeLabel = "نشط",
  inactiveLabel = "غير نشط",
  size = "small",
}) {
  return (
    <Chip
      size={size}
      label={active ? activeLabel : inactiveLabel}
      color={active ? "primary" : "default"}
      variant={active ? "filled" : "outlined"}
    />
  );
}
