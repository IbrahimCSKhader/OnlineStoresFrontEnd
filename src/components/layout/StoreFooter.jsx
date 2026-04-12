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
  const year = new Date().getFullYear();
  const { isOwnerPreview, buildStorePreviewPath } = useOwnerStorePreview();
  const contactEntries = getStoreContactEntries(store);
  const primaryWhatsApp = contactEntries.find(
    (entry) => entry.platform === "WhatsApp",
  );
  const localLinks = [
    { to: buildStorePreviewPath(`/market/${slug}`), label: "الرئيسية" },
    { to: buildStorePreviewPath(`/market/${slug}/about`), label: "من نحن" },
    { to: buildStorePreviewPath(`/market/${slug}/contact`), label: "تواصل" },
    {
      to: buildStorePreviewPath(`/market/${slug}/cart`),
      label: "السلة",
      disabled: isOwnerPreview,
    },
  ];

  return (
    <Box component="footer" className="store-local-footer">
      <Box className="store-local-footer__grid">
        <Box className="store-local-footer__story">
          <Typography variant="h4" className="store-local-footer__title">
            {store?.name || "المتجر"}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={store?.businessType || "متجر"} variant="outlined" />
            <Chip
              label={store?.isActive === false ? "غير نشط" : "نشط"}
              variant="outlined"
            />
          </Stack>
        </Box>

        <Box
          component="nav"
          className="store-local-footer__links"
          aria-label="روابط المتجر"
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
            >
              تواصل
            </AppButton>
            {primaryWhatsApp?.url ? (
              <AppButton
                component="a"
                href={primaryWhatsApp.url}
                target="_blank"
                rel="noreferrer"
                variant="text"
              >
                واتساب
              </AppButton>
            ) : null}
          </Stack>

          <StoreContactAccounts
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
