import { Link as RouterLink, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SouthRoundedIcon from "@mui/icons-material/SouthRounded";
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
          <Typography variant="body1" className="storefront-subtitle">
            وسائل التواصل الخاصة بالمتجر أصبحت تظهر في فوتر جميع صفحات
            المتجر ليصل إليها الزائر من أي صفحة بطريقة واضحة.
          </Typography>

          <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
            <AppButton
              component={RouterLink}
              to={buildStorePreviewPath(`/market/${slug}`)}
              variant="contained"
            >
              العودة لواجهة المتجر
            </AppButton>
            <AppButton
              href="#store-footer"
              variant="outlined"
              startIcon={<SouthRoundedIcon fontSize="small" />}
            >
              الانتقال إلى الفوتر
            </AppButton>
          </Stack>
        </Box>
      </SurfaceCard>

      <SurfaceCard className="page-store-contact__notice">
        <Typography variant="h4">كل قنوات التواصل في مكان واحد</Typography>
        <Typography variant="body1" color="text.secondary">
          انزل لأسفل الصفحة وستجد كل حسابات التواصل في فوتر المتجر،
          بدل تكرارها في أكثر من مكان.
        </Typography>
      </SurfaceCard>
    </Box>
  );
}
