import { useContext } from "react";
import { NavLink } from "react-router-dom";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import { StoreFavoritesContext } from "../../hooks/storefront/storeFavoritesContext.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";

export default function StoreFavoritesButton({ storeSlug, appNavbar = false }) {
  const favorites = useContext(StoreFavoritesContext);
  const { t, dir } = useStorefrontLanguage();
  if (!favorites || !storeSlug) return null;

  const label = t("المفضلة");
  return (
    <>
      <IconButton
        component={NavLink}
        to={buildStorefrontPath(storeSlug, "/favorites")}
        className={appNavbar ? "app-navbar__action" : "store-navbar__icon-button"}
        aria-label={label}
        title={label}
      >
        <Badge badgeContent={favorites.ids.size} color="error" aria-hidden="true">
          <FavoriteBorderRounded fontSize="small" />
        </Badge>
        {appNavbar && <span className="app-navbar__label">{label}</span>}
      </IconButton>
      <Snackbar open={favorites.mutationError} autoHideDuration={5000} onClose={favorites.dismissError}>
        <Alert severity="error" dir={dir} onClose={favorites.dismissError}>
          {t("تعذر تحديث المفضلة. حاول مرة أخرى.")}
        </Alert>
      </Snackbar>
    </>
  );
}
