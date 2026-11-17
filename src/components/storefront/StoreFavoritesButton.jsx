import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import { StoreFavoritesContext } from "../../hooks/storefront/storeFavoritesContext.js";
import useStorefrontCatalogProducts from "../../hooks/products/useStorefrontCatalogProducts.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import ProductFavoriteButton from "./ProductFavoriteButton.jsx";

function FavoriteProducts({ favorites, storeSlug, onClose, language, t }) {
  const catalog = useStorefrontCatalogProducts(favorites.storeId, { language, enabled: favorites.ids.size > 0 });
  const products = catalog.data.filter(product => favorites.ids.has(product.id));
  if (favorites.loading || catalog.isLoading) return <p role="status">{t("جارٍ التحميل…")}</p>;
  if (catalog.error) return <Alert severity="error">{t("تعذر تحميل المفضلة.")}</Alert>;
  if (!products.length && !favorites.error) return <p>{t("ما في منتجات بالمفضلة بعد.")}</p>;

  return (
    <List disablePadding>
      {products.map(product => (
        <ListItem key={product.id} disableGutters secondaryAction={<ProductFavoriteButton product={product} />}>
          <ListItemButton component={Link} to={buildStorefrontPath(storeSlug, `/product/${product.id}`)} onClick={onClose}>
            <ListItemText primary={product.name} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

export default function StoreFavoritesButton({ storeSlug, appNavbar = false }) {
  const favorites = useContext(StoreFavoritesContext);
  const { t, language, dir, locale } = useStorefrontLanguage();
  const [open, setOpen] = useState(false);
  if (!favorites || !storeSlug) return null;

  const close = () => setOpen(false);
  return (
    <>
      <IconButton className={appNavbar ? "app-navbar__action" : "store-navbar__icon-button"} aria-label={t("المفضلة")}
        title={t("المفضلة")} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <Badge badgeContent={favorites.ids.size} color="error" aria-hidden="true"><FavoriteBorderRounded fontSize="small" /></Badge>
        {appNavbar && <span className="app-navbar__label">{t("المفضلة")}</span>}
      </IconButton>
      <Snackbar open={!open && favorites.mutationError} autoHideDuration={5000} onClose={favorites.dismissError}>
        <Alert severity="error" dir={dir} onClose={favorites.dismissError}>{t("تعذر تحديث المفضلة. حاول مرة أخرى.")}</Alert>
      </Snackbar>
      <Dialog open={open} onClose={close} fullWidth maxWidth="xs" dir={dir} lang={locale}
        aria-labelledby="store-favorites-title">
        <DialogTitle id="store-favorites-title">{t("المفضلة")}</DialogTitle>
        <DialogContent dividers>
          {favorites.error && (
            <Alert severity="error" action={favorites.retry ? <Button onClick={() => favorites.retry()}>{t("إعادة المحاولة")}</Button> : null}>
              {t("تعذر تحديث المفضلة. حاول مرة أخرى.")}
            </Alert>
          )}
          {open && <FavoriteProducts favorites={favorites} storeSlug={storeSlug} onClose={close} language={language} t={t} />}
        </DialogContent>
        <DialogActions><Button onClick={close}>{t("إغلاق")}</Button></DialogActions>
      </Dialog>
    </>
  );
}
