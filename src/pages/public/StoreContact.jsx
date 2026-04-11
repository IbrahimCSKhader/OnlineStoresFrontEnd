import { Link as RouterLink, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { getStoreContactEntries } from "../../utils/storeContacts.js";
import StoreContactAccounts from "../../components/common/StoreContactAccounts.jsx";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./StoreContact.css";

export default function StoreContact() {
  const { slug } = useParams();
  const storeQuery = useStoreBySlug(slug);
  const store = normalizeEntityResponse(storeQuery.data);

  useStoreBranding(store);
  const contactEntries = getStoreContactEntries(store);

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-store-contact">
        <EmptyState title="جاري التحميل..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-store-contact">
        <EmptyState title="تعذر فتح الصفحة" />
      </Box>
    );
  }
  return (
    <Box className="storefront-page page-store-contact">
      <SurfaceCard variant="hero" className="page-store-contact__hero">
        <Box className="storefront-section__copy">
          <span className="storefront-eyebrow">تواصل</span>
          <Typography
            variant="h1"
            className="storefront-title page-store-contact__title"
          >
            تواصل مع {store.name}
          </Typography>

          <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
            <AppButton
              component={RouterLink}
              to={`/market/${slug}`}
              variant="contained"
            >
              العودة لواجهة المتجر
            </AppButton>
            <AppButton
              component={RouterLink}
              to={`/market/${slug}/about`}
              variant="outlined"
            >
              من نحن
            </AppButton>
          </Stack>
        </Box>
      </SurfaceCard>

      {contactEntries.length ? (
        <StoreContactAccounts
          accounts={contactEntries}
          showTitle={false}
          layout="cards"
          className="page-store-contact__accounts"
          hideWhenEmpty
        />
      ) : (
        <EmptyState title="لا توجد وسائل تواصل" />
      )}
    </Box>
  );
}
