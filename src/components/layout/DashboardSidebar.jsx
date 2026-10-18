import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
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
  const { t } = useOwnerLanguage();
  return (
    <Paper className="owner-sidebar" elevation={0}>
      <Box className="owner-sidebar__brand">
        <Typography variant="overline" className="owner-sidebar__eyebrow">{t("إدارة المتجر")}</Typography>
        <Typography variant="h5">{t(store?.name || "متجرك")}</Typography>
        <Typography variant="body2" color="text.secondary">{t("تابع المنتجات والعروض والطلبات من مساحة واحدة مرتبة وواضحة طوال اليوم.")}</Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {store?.slug ? <Chip label={t(`/${store.slug}`)} variant="outlined" /> : null}
          {store?.businessType ? <Chip label={t(store.businessType)} /> : null}
          <Chip
            color={store?.isActive ? "primary" : "default"}
            variant={store?.isActive ? "filled" : "outlined"}
            label={t(store?.isActive ? "المتجر جاهز" : "المتجر غير ظاهر")}
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
                {t(item.icon)}
              </Box>

              <Box className="owner-sidebar__nav-copy">
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={1}
                >
                  <Typography variant="subtitle2">{t(item.label)}</Typography>
                  {item.count !== undefined ? (
                    <span className="owner-sidebar__nav-count">{t(item.count)}</span>
                  ) : null}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {t(item.description)}
                </Typography>
              </Box>
            </button>
          );
        })}
      </Stack>
    </Paper>
  );
}
