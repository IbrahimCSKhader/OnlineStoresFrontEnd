import Box from "@mui/material/Box";

export default function DashboardLayout({ sidebar, children }) {
  return (
    <Box className="owner-shell">
      <Box className="owner-shell__sidebar">{sidebar}</Box>
      <Box className="owner-shell__content">{children}</Box>
    </Box>
  );
}
