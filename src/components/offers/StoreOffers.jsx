import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import useOffers from "../../hooks/offers/useOffers.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import { offerApi } from "../../API/offer.api.js";
import { addGuestBundle } from "../../utils/guestCart.js";
import { queryKeys } from "../../utils/queryKeys.js";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import formatCurrency from "../../utils/formatCurrency.js";
import extractApiError from "../../utils/extractApiError.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import OfferBadge from "./OfferBadge.jsx";
import "./Offers.css";

export default function StoreOffers({ store, disabled = false }) {
  const { t, locale } = useStorefrontLanguage();
  const offers = useOffers(store?.id);
  const session = useStorefrontSession(store?.id, store?.slug);
  const cache = useQueryClient();
  const add = useMutation({
    mutationFn: offer => session.useLocalGuestCart
      ? addGuestBundle(store.id, offer)
      : offerApi.addBundle({ storeId: store.id, offerId: offer.id, quantity: 1 }),
    onSuccess: data => cache.setQueryData(queryKeys.cart.byStore(store.id), data),
  });
  const bundles = (offers.data || []).filter(o => Number(o.type) === 1);
  return <section className="storefront-section store-offers" id="store-offers" aria-label={t("عروضات المتجر")}>
    <header className="store-offers__head"><div><span className="storefront-eyebrow">{t("سعر واحد، منتجات أكثر")}</span><h2>{t("عروضات المتجر")}</h2></div></header>
    {offers.isLoading && <p role="status">{t("جارٍ تحميل العروض...")}</p>}
    {offers.isError && <Alert severity="error" action={<button onClick={() => offers.refetch()}>{t("إعادة المحاولة")}</button>}>{t("تعذر تحميل العروض")}</Alert>}
    {add.isError && <Alert severity="error">{extractApiError(add.error, t("تعذر إضافة الباكيج"))}</Alert>}
    {add.isSuccess && <Alert severity="success">{t("تمت إضافة الباكيج للسلة")}</Alert>}
    {!offers.isLoading && !offers.isError && !bundles.length && <p className="store-offers__empty">{t("ترقبوا عروضات المتجر قريباً")}</p>}
    <div className="store-offers__grid">{bundles.map(offer => <article className="bundle-card" key={offer.id}>
      <div className="bundle-card__media">
        <div className="bundle-card__images">{offer.items.map(item => <figure key={item.id || item.productId}>
          {item.productImageUrl ? <img src={resolveAssetUrl(item.productImageUrl)} alt={item.productName} loading="lazy" /> : <span className="bundle-card__placeholder">{item.productName}</span>}
          <figcaption>{item.productName}<b> × {item.requiredQuantity}</b></figcaption>
        </figure>)}</div>
        <OfferBadge>{offer.savings > 0 ? `${t("وفر")} ${Math.round(offer.savings / offer.regularPrice * 100)}%` : t("باكيج")}</OfferBadge>
      </div>
      <div className="bundle-card__body"><span className="bundle-card__eyebrow">{t("باكيج المتجر")}</span><h3>{offer.name}</h3>{offer.description && <p>{offer.description}</p>}
        <div className="bundle-card__price"><strong>{formatCurrency(offer.bundlePrice, { locale })}</strong>{offer.regularPrice > offer.bundlePrice && <del>{formatCurrency(offer.regularPrice, { locale })}</del>}</div>
        {!store.isCatalog && <button className="bundle-card__add" disabled={disabled || add.isPending || offer.availableBundles <= 0} onClick={() => add.mutate(offer)}>{offer.availableBundles <= 0 ? t("نفدت الكمية") : add.isPending && add.variables?.id === offer.id ? t("جارٍ الإضافة...") : t("أضف الباكيج للسلة")}</button>}
      </div>
    </article>)}</div>
  </section>;
}
