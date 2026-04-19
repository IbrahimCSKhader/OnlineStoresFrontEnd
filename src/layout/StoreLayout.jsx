import { Outlet, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Header from "../components/layout/Header/Header.jsx";
import StoreFooter from "../components/layout/StoreFooter.jsx";
import useStoreBySlug from "../hooks/stores/useStoreBySlug.js";
import useOwnerStorePreview from "../hooks/stores/useOwnerStorePreview.js";
import { normalizeEntityResponse } from "../utils/collections.js";
import useStoreBranding from "../theme/useStoreBranding.js";
import "./StoreLayout.css";

export default function StoreLayout() {
  const { slug = "" } = useParams();
  const { isOwnerPreview } = useOwnerStorePreview();
  const storeQuery = useStoreBySlug(slug, {
    enabled: Boolean(slug),
    staleTime: 60000,
  });
  const store = normalizeEntityResponse(storeQuery.data);

  useStoreBranding(store);

  return (
    <Box className="store-layout">
      <Header />
      <Box component="main" className="store-layout__content">
        {isOwnerPreview ? (
          <Alert severity="info" className="store-layout__preview-alert">
            هذه معاينة كتاجر. أزرار السلة والشراء معطلة هنا لعرض الواجهة فقط.
          </Alert>
        ) : null}
        <Outlet />
      </Box>
      <Box className="store-layout__footer" id="store-footer">
        <StoreFooter store={store} slug={slug} />
      </Box>
    </Box>
  );
}
