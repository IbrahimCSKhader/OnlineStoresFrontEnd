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
        <EmptyState title="ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-store-contact">
        <EmptyState title="طھط¹ط°ط± ظپطھط­ ط§ظ„طµظپط­ط©" />
      </Box>
    );
  }

  return (
    <Box className="storefront-page page-store-contact">
      <SurfaceCard variant="hero" className="page-store-contact__hero">
        <Box className="storefront-section__copy">
          <span className="storefront-eyebrow">طھظˆط§طµظ„</span>
          <Typography
            variant="h1"
            className="storefront-title page-store-contact__title"
          >
            طھظˆط§طµظ„ ظ…ط¹ {store.name}
          </Typography>
          <Typography variant="body1" className="storefront-subtitle">
            ظˆط³ط§ط¦ظ„ ط§ظ„طھظˆط§طµظ„ ط§ظ„ط®ط§طµط© ط¨ط§ظ„ظ…طھط¬ط± ط£طµط¨ط­طھ طھط¸ظ‡ط± ظپظٹ ظپظˆطھط± ط¬ظ…ظٹط¹ طµظپط­ط§طھ
            ط§ظ„ظ…طھط¬ط± ظ„ظٹطµظ„ ط¥ظ„ظٹظ‡ط§ ط§ظ„ط²ط§ط¦ط± ظ…ظ† ط£ظٹ طµظپط­ط© ط¨ط·ط±ظٹظ‚ط© ظˆط§ط¶ط­ط©.
          </Typography>

          <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
            <AppButton
              component={RouterLink}
              to={buildStorePreviewPath(`/market/${slug}`)}
              variant="contained"
            >
              ط§ظ„ط¹ظˆط¯ط© ظ„ظˆط§ط¬ظ‡ط© ط§ظ„ظ…طھط¬ط±
            </AppButton>
            <AppButton
              href="#store-footer"
              variant="outlined"
              startIcon={<SouthRoundedIcon fontSize="small" />}
            >
              ط§ظ„ط§ظ†طھظ‚ط§ظ„ ط¥ظ„ظ‰ ط§ظ„ظپظˆطھط±
            </AppButton>
          </Stack>
        </Box>
      </SurfaceCard>

      <SurfaceCard className="page-store-contact__notice">
        <Typography variant="h4">ظƒظ„ ظ‚ظ†ظˆط§طھ ط§ظ„طھظˆط§طµظ„ ظپظٹ ظ…ظƒط§ظ† ظˆط§ط­ط¯</Typography>
        <Typography variant="body1" color="text.secondary">
          ط§ظ†ط²ظ„ ظ„ط£ط³ظپظ„ ط§ظ„طµظپط­ط© ظˆط³طھط¬ط¯ ظƒظ„ ط­ط³ط§ط¨ط§طھ ط§ظ„طھظˆط§طµظ„ ظپظٹ ظپظˆطھط± ط§ظ„ظ…طھط¬ط±طŒ
          ط¨ط¯ظ„ طھظƒط±ط§ط±ظ‡ط§ ظپظٹ ط£ظƒط«ط± ظ…ظ† ظ…ظƒط§ظ†.
        </Typography>
      </SurfaceCard>
    </Box>
  );
}
