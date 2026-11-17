import { useContext } from "react";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRounded from "@mui/icons-material/FavoriteRounded";
import IconButton from "@mui/material/IconButton";
import { StoreFavoritesContext } from "../../hooks/storefront/storeFavoritesContext.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";

export default function ProductFavoriteButton({ product, className, tabIndex }) {
  const favorites = useContext(StoreFavoritesContext);
  const { t } = useStorefrontLanguage();
  if (!favorites || !product.id || (product.storeId && product.storeId !== favorites.storeId)) return null;

  const selected = favorites.ids.has(product.id);
  const label = selected ? t("إزالة {0} من المفضلة", product.name) : t("إضافة {0} إلى المفضلة", product.name);
  return (
    <IconButton
      aria-label={label}
      aria-pressed={selected}
      className={className}
      color={selected ? "error" : "default"}
      disabled={!favorites.canToggle || favorites.busy}
      onClick={() => favorites.toggle(product.id)}
      tabIndex={tabIndex}
      size="small"
    >
      {selected ? <FavoriteRounded fontSize="small" /> : <FavoriteBorderRounded fontSize="small" />}
    </IconButton>
  );
}
