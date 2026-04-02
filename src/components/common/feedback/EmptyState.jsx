import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SurfaceCard from "../cards/SurfaceCard.jsx";

export default function EmptyState({ title, description, action }) {
  return (
    <SurfaceCard variant="subtle" className="app-empty-state">
      <Box className="app-empty-state__body">
        <Typography variant="h5">{title}</Typography>
        {description ? (
          <Typography
            variant="body1"
            color="text.secondary"
            className="app-empty-state__description"
          >
            {description}
          </Typography>
        ) : null}
        {action ?? null}
      </Box>
    </SurfaceCard>
  );
}
