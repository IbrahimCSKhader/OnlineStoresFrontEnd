import { useDeferredValue, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import StoreGrid from "../../components/storefront/StoreGrid.jsx";
import { SITE_BRAND_ASSET_PATH } from "../../constants/siteBranding.js";
import useStores from "../../hooks/stores/useStores.js";
import { normalizeListResponse } from "../../utils/collections.js";
import "./Market.css";

export default function Market() {
  const [searchText, setSearchText] = useState("");
  const deferredSearchText = useDeferredValue(searchText);
  const storesQuery = useStores(undefined, { refetchOnWindowFocus: false });
  const stores = useMemo(
    () => normalizeListResponse(storesQuery.data),
    [storesQuery.data],
  );

  const filteredStores = useMemo(() => {
    const keyword = deferredSearchText.toLowerCase().trim();

    if (!keyword) {
      return stores;
    }

    return stores.filter((store) =>
      [store.name, store.description, store.businessType, store.slug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [deferredSearchText, stores]);

  return (
    <Box className="storefront-page page-market">
      <SurfaceCard variant="hero" className="storefront-hero page-market__hero">
        <Box className="page-market__hero-grid">
          <Box className="storefront-hero__copy page-market__hero-copy">
            <span className="storefront-eyebrow">ط§ظ„ظ…طھط§ط¬ط±</span>
            <Typography variant="h1" className="storefront-title page-market__title">
              ط¬ظ…ظٹط¹ ط§ظ„ظ…طھط§ط¬ط±
            </Typography>

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              <AppButton href="#market-directory" variant="contained">
                ط§ط¨ط¯ط£ ط§ظ„طھطµظپط­
              </AppButton>
              <AppButton component={RouterLink} to="/" variant="outlined">
                ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©
              </AppButton>
            </Stack>
          </Box>

          <Box className="page-market__hero-media" aria-hidden>
            <img src={SITE_BRAND_ASSET_PATH} alt="mawja" />
          </Box>
        </Box>
      </SurfaceCard>

      <Box className="storefront-section" id="market-directory">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">ظ‚ط§ط¦ظ…ط©</span>
            <Typography variant="h3">ط¬ظ…ظٹط¹ ط§ظ„ظ…طھط§ط¬ط±</Typography>
          </Box>

          <Box className="page-market__search">
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="ط§ط¨ط­ط« ط¨ط§ط³ظ… ط§ظ„ظ…طھط¬ط± ط£ظˆ ظ†ظˆط¹ ط§ظ„ظ†ط´ط§ط·"
            />
          </Box>
        </Box>

        <StoreGrid
          stores={filteredStores}
          loading={storesQuery.isLoading}
          error={storesQuery.error}
          onRetry={storesQuery.refetch}
        />
      </Box>
    </Box>
  );
}
