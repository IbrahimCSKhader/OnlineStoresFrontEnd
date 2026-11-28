import { Outlet, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Header from "../components/layout/Header/Header.jsx";
import StoreFooter from "../components/layout/StoreFooter.jsx";
import StoreRegistrationPrompt from "../components/auth/StoreRegistrationPrompt.jsx";
import StoreFavoritesProvider from "../components/storefront/StoreFavoritesProvider.jsx";
import useStoreBySlug from "../hooks/stores/useStoreBySlug.js";
import useStorefrontLanguage from "../hooks/storefront/useStorefrontLanguage.js";
import useOwnerStorePreview from "../hooks/stores/useOwnerStorePreview.js";
import { normalizeEntityResponse } from "../utils/collections.js";
import { getCurrentCustomDomainHost } from "../utils/customDomain.js";
import useStoreBranding from "../theme/useStoreBranding.js";
import useStoreInstallManifest from "../hooks/useStoreInstallManifest.js";
import { normalizeStoreThemeTemplate } from "../constants/storeThemeTemplates.js";
import "./StoreLayout.css";
import { isAlaaStore } from "../theme/alaaTheme.js";
import "../theme/alaa.css";

export default function StoreLayout() {
  const { slug = "" } = useParams();
  const theme = useTheme();
  const { t, language, dir, locale, isLanguageLoading } = useStorefrontLanguage();
  const customDomainHost = getCurrentCustomDomainHost();
  const { isOwnerPreview } = useOwnerStorePreview();
  const storeQuery = useStoreBySlug(slug, {
    enabled: Boolean(slug || customDomainHost),
    language,
    staleTime: 60000,
  });
  const store = normalizeEntityResponse(storeQuery.data);
  const effectiveSlug = slug || store?.slug || "";
  const isSallabasket = effectiveSlug.toLowerCase() === "sallabasket";
  const useBottomNavigation = useMediaQuery(theme.breakpoints.down(isSallabasket ? "lg" : "sm"));
  const hasAppNavbarTemplate =
    normalizeStoreThemeTemplate(store?.themeTemplate ?? store?.ThemeTemplate) === "O";
  const alaa = isAlaaStore(store);
  const appNavbar = Boolean(store?.id) && (alaa || useBottomNavigation || (!isSallabasket && hasAppNavbarTemplate));

  useStoreInstallManifest(effectiveSlug);
  useStoreBranding(store);

  if (isLanguageLoading || (storeQuery.isLoading && !store)) {
    return <Box className="store-layout" aria-busy="true" sx={{ minHeight: "60vh" }} />;
  }

  return (
    <StoreFavoritesProvider
      storeId={store?.id}
      storeSlug={effectiveSlug}
      disabled={isOwnerPreview || store?.isActive === false}
    >
      <Box className={`store-layout${appNavbar ? " store-layout--app-navbar" : ""}${alaa ? " store-layout--alaa" : ""}`} dir={dir} lang={locale}>
        <Header appNavbar={appNavbar} />
        <Box component="main" className="store-layout__content">
          {isOwnerPreview ? (
            <Alert severity="info" className="store-layout__preview-alert">{t("هذه معاينة كتاجر. أزرار السلة والشراء معطلة هنا لعرض الواجهة فقط.")}</Alert>
          ) : null}
          <Outlet />
        </Box>
        <Box className="store-layout__footer" id="store-footer">
          <StoreFooter store={store} slug={effectiveSlug} />
        </Box>
        {!isOwnerPreview && store?.isActive !== false && store?.enableCustomerRegistrationPrompt === true ? (
          <StoreRegistrationPrompt store={store} slug={effectiveSlug} dir={dir} lang={locale} t={t} />
        ) : null}
      </Box>
    </StoreFavoritesProvider>
  );
}
