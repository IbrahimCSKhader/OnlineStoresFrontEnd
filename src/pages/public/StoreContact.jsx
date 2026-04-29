import { Link as RouterLink, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./StoreContact.css";

export default function StoreContact() {
  const { slug } = useParams();
  const { buildStorePreviewPath } = useOwnerStorePreview();
  const storeQuery = useStoreBySlug(slug);
  const store = normalizeEntityResponse(storeQuery.data);

  useStoreBranding(store);

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-store-contact">
        <EmptyState title="جارٍ التحميل..." />
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
          <Typography variant="body1" className="storefront-subtitle">
            إذا كان لديك أي استفسار حول المنتجات أو الطلبات، يسعدنا مساعدتك.
          </Typography>

          <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
            <AppButton
              component={RouterLink}
              to={buildStorePreviewPath(`/market/${slug}`)}
              variant="contained"
            >
              العودة لواجهة المتجر
            </AppButton>
          </Stack>
        </Box>
      </SurfaceCard>

      <SurfaceCard className="page-store-contact__notice">
        <Typography variant="h4">نحن هنا لمساعدتك</Typography>
        <Typography variant="body1" color="text.secondary">
          نسعد بالرد على أسئلتك المتعلقة بالمنتجات، التوفر، والطلبات.
        </Typography>
      </SurfaceCard>
    </Box>
  );
}
