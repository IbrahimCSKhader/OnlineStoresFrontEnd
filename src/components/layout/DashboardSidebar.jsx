import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function DashboardSidebar({
  store,
  activeTab,
  items,
  onNavigate,
}) {
  return (
    <Paper className="owner-sidebar" elevation={0}>
      <Box className="owner-sidebar__brand">
        <Typography variant="overline" className="owner-sidebar__eyebrow">
          إدارة المتجر
        </Typography>
        <Typography variant="h5">{store?.name || "متجرك"}</Typography>
        <Typography variant="body2" color="text.secondary">
          تابع المنتجات والعروض والطلبات من مساحة واحدة مرتبة وواضحة طوال اليوم.
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {store?.slug ? <Chip label={`/${store.slug}`} variant="outlined" /> : null}
          {store?.businessType ? <Chip label={store.businessType} /> : null}
          <Chip
            color={store?.isActive ? "primary" : "default"}
            variant={store?.isActive ? "filled" : "outlined"}
            label={store?.isActive ? "المتجر جاهز" : "المتجر غير ظاهر"}
          />
        </Stack>
      </Box>

      <Stack className="owner-sidebar__nav" spacing={1}>
        {items.map((item) => {
          const isActive = item.key === activeTab;

          return (
            <button
              key={item.key}
              type="button"
              className={`owner-sidebar__nav-item${isActive ? " owner-sidebar__nav-item--active" : ""}`}
              onClick={() => onNavigate(item.key)}
            >
              <Box className="owner-sidebar__nav-icon" aria-hidden>
                {item.icon}
              </Box>

              <Box className="owner-sidebar__nav-copy">
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={1}
                >
                  <Typography variant="subtitle2">{item.label}</Typography>
                  {item.count !== undefined ? (
                    <span className="owner-sidebar__nav-count">{item.count}</span>
                  ) : null}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {item.description}
                </Typography>
              </Box>
            </button>
          );
        })}
      </Stack>
    </Paper>
  );
}
