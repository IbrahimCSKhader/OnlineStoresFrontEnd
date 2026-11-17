import { useContext } from "react";
import { Link, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import ProductGrid, { ProductGridSkeleton } from "../../components/product/ProductGrid.jsx";
import useStorefrontCatalogProducts from "../../hooks/products/useStorefrontCatalogProducts.js";
import { StoreFavoritesContext } from "../../hooks/storefront/storeFavoritesContext.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";

export default function Favorites() {
  const { slug } = useParams();
  const { t, language } = useStorefrontLanguage();
  const favorites = useContext(StoreFavoritesContext);
  const storeQuery = useStoreBySlug(slug, { language });
  const store = normalizeEntityResponse(storeQuery.data);
  const storeSlug = store?.slug || slug;
  const catalog = useStorefrontCatalogProducts(favorites?.storeId, {
    language,
    enabled: Boolean(favorites?.ids.size),
  });
  const products = catalog.data.filter(product => favorites?.ids.has(product.id));
  const loading = storeQuery.isLoading || favorites?.loading || catalog.isLoading;
  const retry = favorites?.retry || (favorites?.ids.size && catalog.error ? catalog.refetch : null);
  const continueShopping = (
    <AppButton component={Link} to={buildStorefrontPath(storeSlug, "/products")} variant="outlined">
      {t("متابعة التسوق")}
    </AppButton>
  );

  return (
    <Box className="storefront-page">
      <SurfaceCard sx={{ p: { xs: 2, sm: 3 } }}>
        <Box className="storefront-section__head">
          <Typography variant="h3" component="h1">{t("المفضلة")}</Typography>
          {store && continueShopping}
        </Box>
      </SurfaceCard>

      {loading ? (
        <Box role="status" aria-label={t("جارٍ التحميل…")}>
          <ProductGridSkeleton count={4} />
        </Box>
      ) : retry ? (
        <Alert severity="error" action={<Button onClick={() => retry()}>{t("إعادة المحاولة")}</Button>}>
          {t("تعذر تحميل المفضلة.")}
        </Alert>
      ) : !favorites || storeQuery.error ? (
        <EmptyState title={t("تعذر فتح الصفحة")} />
      ) : products.length ? (
        <ProductGrid products={products} storeSlug={storeSlug} scrollAnchorScope="favorites" />
      ) : (
        <EmptyState title={t("ما في منتجات بالمفضلة بعد.")} />
      )}
    </Box>
  );
}
