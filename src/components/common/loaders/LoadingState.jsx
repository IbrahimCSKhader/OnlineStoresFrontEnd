import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import SurfaceCard from "../cards/SurfaceCard.jsx";

export default function LoadingState({ label = "جارٍ التحميل..." }) {
  return (
    <SurfaceCard variant="subtle" className="app-loading-state">
      <Box className="app-loading-state__body">
        <CircularProgress size={34} thickness={4.2} />
        <Typography variant="body1" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </SurfaceCard>
  );
}
