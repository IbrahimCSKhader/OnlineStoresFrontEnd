import { Outlet, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Header from "../components/layout/Header/Header.jsx";
import StoreFooter from "../components/layout/StoreFooter.jsx";
import useStoreBySlug from "../hooks/stores/useStoreBySlug.js";
import { normalizeEntityResponse } from "../utils/collections.js";
import useStoreBranding from "../theme/useStoreBranding.js";
import "./StoreLayout.css";

export default function StoreLayout() {
  const { slug = "" } = useParams();
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
        <Outlet />
      </Box>
      <Box className="store-layout__footer">
        <StoreFooter store={store} slug={slug} />
      </Box>
    </Box>
  );
}
