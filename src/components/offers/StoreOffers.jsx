import { Link } from "react-router-dom";
import useAddBundle from "../../hooks/offers/useAddBundle.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import { offerSavingsPercent } from "../../utils/offers.js";
import Alert from "@mui/material/Alert";
import useOffers from "../../hooks/offers/useOffers.js";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import formatCurrency from "../../utils/formatCurrency.js";
import extractApiError from "../../utils/extractApiError.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import OfferBadge from "./OfferBadge.jsx";
import "./Offers.css";

export default function StoreOffers({ store, disabled = false, showAll = false }) {
  const { t, locale } = useStorefrontLanguage();
  const offers = useOffers(store?.id);
  const add = useAddBundle(store);
  const { buildStorePreviewPath } = useOwnerStorePreview();
  const bundles = (offers.data || []).filter(o => Number(o.type) === 1);
  const visibleBundles = showAll ? bundles : bundles.slice(0, 4);
  return <section className="storefront-section store-offers" id="store-offers" aria-label={t("عروضات المتجر")}>
    <header className="store-offers__head"><div><span className="storefront-eyebrow">{t("سعر واحد، منتجات أكثر")}</span><h2>{t("عروضات المتجر")}</h2></div>{!showAll && bundles.length > 4 && <Link className="store-offers__all" to={buildStorePreviewPath(buildStorefrontPath(store.slug, "/offers"))}>{t("كل العروض")}</Link>}</header>
    {offers.isLoading && <p role="status">{t("جارٍ تحميل العروض...")}</p>}
    {offers.isError && <Alert severity="error" action={<button onClick={() => offers.refetch()}>{t("إعادة المحاولة")}</button>}>{t("تعذر تحميل العروض")}</Alert>}
    {add.isError && <Alert severity="error">{extractApiError(add.error, t("تعذر إضافة الباكيج"))}</Alert>}
    {add.isSuccess && <Alert severity="success">{t("تمت إضافة الباكيج للسلة")}</Alert>}
    {!offers.isLoading && !offers.isError && !bundles.length && <p className="store-offers__empty">{t("ترقبوا عروضات المتجر قريباً")}</p>}
    <div className="store-offers__grid">{visibleBundles.map(offer => <article className="bundle-card" key={offer.id}>
      <div className="bundle-card__media">
        <div className="bundle-card__images">{offer.items.slice(0, 4).map(item => <figure key={item.id || item.productId}>
          {item.productImageUrl ? <img src={resolveAssetUrl(item.productImageUrl)} alt={item.productName} loading="lazy" /> : <span className="bundle-card__placeholder">{item.productName}</span>}
          <figcaption>{item.productName}<b> × {item.requiredQuantity}</b></figcaption>
        </figure>)}</div>
        <OfferBadge>{`${t("وفر")} ${offerSavingsPercent(offer)}%`}</OfferBadge>
      </div>
      <div className="bundle-card__body"><span className="bundle-card__eyebrow">{t("باكيج المتجر")}</span><h3>{offer.name}</h3>{offer.description && <p>{offer.description}</p>}
        <div className="bundle-card__price"><strong>{formatCurrency(offer.bundlePrice, { locale })}</strong>{offer.regularPrice > offer.bundlePrice && <del>{formatCurrency(offer.regularPrice, { locale })}</del>}</div>
        {offer.items.length > 4 && <p className="bundle-card__more">{t("ومنتجات إضافية: {0}", offer.items.length - 4)}</p>}
        <Link className="bundle-card__details" to={buildStorePreviewPath(buildStorefrontPath(store.slug, `/offers/${offer.id}`))}>{t("عرض تفاصيل الباكيج")}</Link>
        {!store.isCatalog && <button className="bundle-card__add" disabled={disabled || add.isPending || offer.availableBundles <= 0} onClick={() => add.mutate(offer)}>{offer.availableBundles <= 0 ? t("نفدت الكمية") : add.isPending && add.variables?.id === offer.id ? t("جارٍ الإضافة...") : t("أضف الباكيج للسلة")}</button>}
      </div>
    </article>)}</div>
  </section>;
}
