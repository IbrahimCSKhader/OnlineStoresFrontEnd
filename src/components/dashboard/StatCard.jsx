import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function StatCard({ label, value, help, icon, tone = "default" }) {
  const { t } = useOwnerLanguage();
  return (
    <Paper className={`owner-stat owner-stat--${tone}`} elevation={0}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="overline" className="owner-stat__label">
            {t(label)}
          </Typography>
          <Typography variant="h4" className="owner-stat__value">
            {t(value)}
          </Typography>
        </Box>
        {icon ? <Box className="owner-stat__icon">{t(icon)}</Box> : null}
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {t(help)}
      </Typography>
    </Paper>
  );
}
