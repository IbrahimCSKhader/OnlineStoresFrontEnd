import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";
import StoreContactAccounts from "../common/StoreContactAccounts.jsx";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import { getStoreContactEntries } from "../../utils/storeContacts.js";
import "./StoreFooter.css";

export default function StoreFooter({ store, slug = "" }) {
  const { t } = useStorefrontLanguage();
  const year = new Date().getFullYear();
  const { isOwnerPreview, buildStorePreviewPath } = useOwnerStorePreview();
  const contactEntries = getStoreContactEntries(store);
  const primaryWhatsApp = contactEntries.find(
    (entry) => entry.platform === "WhatsApp",
  );
  const localLinks = [
    { to: buildStorePreviewPath(`/market/${slug}`), label: t("الرئيسية") },
    { to: buildStorePreviewPath(`/market/${slug}/about`), label: t("من نحن") },
    { to: buildStorePreviewPath(`/market/${slug}/contact`), label: t("تواصل") },
    {
      to: buildStorePreviewPath(`/market/${slug}/cart`),
      label: t("السلة"),
      disabled: isOwnerPreview,
      hidden: store?.isCatalog,
    },
  ].filter((link) => !link.hidden);

  return (
    <Box component="footer" className="store-local-footer">
      <Box className="store-local-footer__grid">
        <Box className="store-local-footer__story">
          <Typography variant="h4" className="store-local-footer__title">
            {store?.name || t("المتجر")}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={store?.businessType || t("متجر")} variant="outlined" />
            <Chip
              label={store?.isActive === false ? t("غير نشط") : t("نشط")}
              variant="outlined"
            />
          </Stack>
        </Box>

        <Box
          component="nav"
          className="store-local-footer__links"
          aria-label={t("روابط المتجر")}
        >
          {localLinks.map((link) => (
            link.disabled ? (
              <Box
                key={link.label}
                className="store-local-footer__link store-local-footer__link--disabled"
                aria-disabled="true"
              >
                {link.label}
              </Box>
            ) : (
              <Box
                key={link.label}
                component={RouterLink}
                to={link.to}
                className="store-local-footer__link"
              >
                {link.label}
              </Box>
            )
          ))}
        </Box>

        <Box className="store-local-footer__actions">
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <AppButton
              component={RouterLink}
              to={buildStorePreviewPath(`/market/${slug}/contact`)}
              variant="contained"
            >{t("تواصل")}</AppButton>
            {primaryWhatsApp?.url ? (
              <AppButton
                component="a"
                href={primaryWhatsApp.url}
                target="_blank"
                rel="noreferrer"
                variant="text"
              >{t("واتساب")}</AppButton>
            ) : null}
          </Stack>

          <StoreContactAccounts
            translate={t}
            accounts={contactEntries}
            title=""
            layout="compact"
            showTitle={false}
            hideWhenEmpty
          />
        </Box>
      </Box>

      <Box className="store-local-footer__bottom">
        <Typography variant="body2">
          © {year} {store?.name || "Store"}
        </Typography>
      </Box>
    </Box>
  );
}
