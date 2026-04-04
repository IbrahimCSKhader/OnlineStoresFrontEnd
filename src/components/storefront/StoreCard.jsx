import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import SurfaceCard from "../common/cards/SurfaceCard.jsx";
import { resolveAssetUrl, resolveStoreCoverUrl } from "../../utils/assetUrl.js";
import "./StoreCard.css";

export default function StoreCard({ store }) {
  const isActive = store.isActive !== false;
  const coverImage = resolveStoreCoverUrl(store);
  const logoImage = resolveAssetUrl(store.logoUrl);

  return (
    <SurfaceCard
      interactive
      component={RouterLink}
      to={store.slug ? `/market/${store.slug}` : "/market"}
      className={`store-card${isActive ? "" : " store-card--disabled"}`}
    >
      <Box className="store-card__media">
        {coverImage ? (
          <img
            className="store-card__cover"
            src={coverImage}
            alt={store.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Box className="store-card__cover store-card__cover--empty" aria-hidden>
            <StorefrontRoundedIcon />
          </Box>
        )}

        <Chip
          label={isActive ? "متاح" : "مغلق"}
          size="small"
          className={`store-card__status${isActive ? " store-card__status--active" : ""}`}
        />

        <Box className="store-card__logo-wrap">
          {logoImage ? (
            <img
              className="store-card__logo"
              src={logoImage}
              alt={`${store.name} logo`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Box className="store-card__logo store-card__logo--empty" aria-hidden>
              {store.name?.[0] || "م"}
            </Box>
          )}
        </Box>
      </Box>

      <Box className="store-card__content">
        <Box className="store-card__copy">
          <Typography variant="h6" className="store-card__title">
            {store.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" className="store-card__description">
            {store.description || store.businessType || ""}
          </Typography>
        </Box>

        <Box className="store-card__meta">
          <Chip
            label={store.businessType || "متجر متنوع"}
            size="small"
            variant="outlined"
          />
          <Box className="store-card__views">
            <VisibilityRoundedIcon fontSize="small" />
            <span>{store.visitCount ?? 0}</span>
          </Box>
        </Box>

        <Box className="store-card__action">
          <span>دخول</span>
          <ArrowOutwardRoundedIcon fontSize="small" />
        </Box>
      </Box>
    </SurfaceCard>
  );
}
