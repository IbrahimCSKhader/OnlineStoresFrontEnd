import { Link, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import StoreOffers from "../../components/offers/StoreOffers.jsx";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";

export default function StoreOffersPage() {
  const { slug = "" } = useParams();
  const { t, language } = useStorefrontLanguage();
  const query = useStoreBySlug(slug, { language });
  const store = normalizeEntityResponse(query.data);
  useStoreBranding(store);
  const { isOwnerPreview, buildStorePreviewPath } = useOwnerStorePreview();
  const home = buildStorePreviewPath(buildStorefrontPath(store?.slug || slug));
  return <main className="storefront-page offer-details">
    <Link className="offer-details__back" to={home}>{t("العودة للمتجر")}</Link>
    <h1>{t("كل العروض")}</h1>
    {query.isLoading ? <p role="status">{t("جارٍ تحميل العروض...")}</p> : query.isError ? <Alert severity="error" action={<button onClick={() => query.refetch()}>{t("إعادة المحاولة")}</button>}>{t("تعذر تحميل العروض")}</Alert> : store ? <StoreOffers store={store} disabled={isOwnerPreview} showAll /> : <p>{t("العرض غير متاح حالياً")}</p>}
  </main>;
}
