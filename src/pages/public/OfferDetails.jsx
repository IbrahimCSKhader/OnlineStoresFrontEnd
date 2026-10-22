import { Link, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import useOffers from "../../hooks/offers/useOffers.js";
import useAddBundle from "../../hooks/offers/useAddBundle.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import formatCurrency from "../../utils/formatCurrency.js";
import extractApiError from "../../utils/extractApiError.js";
import { offerSavingsPercent } from "../../utils/offers.js";
import OfferBadge from "../../components/offers/OfferBadge.jsx";
import "../../components/offers/Offers.css";

export default function OfferDetails() {
  const { slug = "", offerId } = useParams();
  const { t, locale, language } = useStorefrontLanguage();
  const storeQuery = useStoreBySlug(slug, { language });
  const store = normalizeEntityResponse(storeQuery.data);
  useStoreBranding(store);
  const offers = useOffers(store?.id);
  const add = useAddBundle(store);
  const { isOwnerPreview, buildStorePreviewPath } = useOwnerStorePreview();
  const home = buildStorePreviewPath(buildStorefrontPath(store?.slug || slug));
  const offer = (offers.data || []).find(item => item.id === offerId && Number(item.type) === 1);
  if (storeQuery.isLoading || (store?.id && offers.isLoading)) {
    return <main className="storefront-page offer-details"><p role="status">{t("جارٍ تحميل العروض...")}</p></main>;
  }
  if (storeQuery.isError || offers.isError) {
    return <main className="storefront-page offer-details"><Alert severity="error">{t("تعذر تحميل العرض")}</Alert><button onClick={() => { storeQuery.refetch(); offers.refetch(); }}>{t("إعادة المحاولة")}</button></main>;
  }
  if (!store || !offer) {
    return <main className="storefront-page offer-details"><h1>{t("العرض غير متاح حالياً")}</h1><Link to={home}>{t("العودة للمتجر")}</Link></main>;
  }
  return <main className="storefront-page offer-details">
    <Link className="offer-details__back" to={home}>{t("العودة للمتجر")}</Link>
    <header className="offer-details__header">
      <span className="bundle-card__eyebrow">{t("باكيج المتجر")}</span>
      <h1>{offer.name}</h1>
      {offer.description && <p>{offer.description}</p>}
      <OfferBadge>{t("وفر")} {offerSavingsPercent(offer)}%</OfferBadge>
      <div className="bundle-card__price"><strong>{formatCurrency(offer.bundlePrice, { locale })}</strong>{offer.regularPrice > offer.bundlePrice && <del>{formatCurrency(offer.regularPrice, { locale })}</del>}</div>
      <p>{t("عدد المنتجات في الباكيج: {0}", offer.items.length)}</p>
      {add.isError && <Alert severity="error">{extractApiError(add.error, t("تعذر إضافة الباكيج"))}</Alert>}
      {add.isSuccess && <Alert severity="success">{t("تمت إضافة الباكيج للسلة")}</Alert>}
      {!store.isCatalog && <button className="bundle-card__add" disabled={isOwnerPreview || add.isPending || offer.availableBundles <= 0} onClick={() => add.mutate(offer)}>{offer.availableBundles <= 0 ? t("نفدت الكمية") : add.isPending ? t("جارٍ الإضافة...") : t("أضف الباكيج للسلة")}</button>}
    </header>
    <section aria-label={t("جميع منتجات الباكيج")}>
      <h2>{t("جميع منتجات الباكيج")}</h2>
      <div className="offer-details__products">{offer.items.map(item => <article className="offer-details__product" key={item.id || item.productId}>
        <Link aria-label={item.productName} to={buildStorePreviewPath(buildStorefrontPath(store.slug, `/product/${item.productId}`))}>
          {item.productImageUrl ? <img src={resolveAssetUrl(item.productImageUrl)} alt={item.productName} loading="lazy" /> : <span className="bundle-card__placeholder">{item.productName}</span>}
          <h3>{item.productName}</h3>
        </Link>
        <p>{t("الكمية ضمن الباكيج: {0}", item.requiredQuantity)}</p>
      </article>)}</div>
    </section>
  </main>;
}
