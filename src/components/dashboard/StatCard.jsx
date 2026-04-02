import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function StatCard({ label, value, help, icon, tone = "default" }) {
  return (
    <Paper className={`owner-stat owner-stat--${tone}`} elevation={0}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="overline" className="owner-stat__label">
            {label}
          </Typography>
          <Typography variant="h4" className="owner-stat__value">
            {value}
          </Typography>
        </Box>
        {icon ? <Box className="owner-stat__icon">{icon}</Box> : null}
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {help}
      </Typography>
    </Paper>
  );
}
