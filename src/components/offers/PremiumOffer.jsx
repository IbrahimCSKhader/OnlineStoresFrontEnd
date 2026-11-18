import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "@mui/material/Alert";
import AppButton from "../common/buttons/AppButton.jsx";
import useOffers from "../../hooks/offers/useOffers.js";
import useAddBundle from "../../hooks/offers/useAddBundle.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import { isPremiumOffer, offerDate, offerSavingsPercent } from "../../utils/offers.js";
import formatCurrency from "../../utils/formatCurrency.js";
import extractApiError from "../../utils/extractApiError.js";
import "./PremiumOffer.css";

export default function PremiumOffer({ store, disabled = false }) {
  const { t, locale } = useStorefrontLanguage();
  const offers = useOffers(store?.id);
  const add = useAddBundle(store);
  const { buildStorePreviewPath } = useOwnerStorePreview();
  const [now, setNow] = useState(() => Date.now());
  const candidates = (offers.data || []).filter(offer => isPremiumOffer(offer) &&
    offer.isActive !== false && offerDate(offer.startDate).getTime() <= now &&
    offerDate(offer.endDate).getTime() > now && offer.items?.length && offer.availableBundles > 0);
  const offer = candidates.sort((a, b) => b.priority - a.priority || offerDate(b.createdAt) - offerDate(a.createdAt))[0];
  const hasTimedOffers = (offers.data || []).some(item => isPremiumOffer(item) && item.endDate);

  useEffect(() => {
    if (!hasTimedOffers) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasTimedOffers]);

  if (!offer) return null;
  const remaining = Math.max(0, Math.ceil((offerDate(offer.endDate).getTime() - now) / 1000));
  const units = [
    [Math.floor(remaining / 86400), t("يوم")],
    [Math.floor(remaining / 3600) % 24, t("ساعة")],
    [Math.floor(remaining / 60) % 60, t("دقيقة")],
    [remaining % 60, t("ثانية")],
  ];
  const image = resolveAssetUrl(offer.items[0].productImageUrl);
  const saving = offerSavingsPercent(offer);
  return <section className="premium-offer" aria-label={t("بريميوم أوفير")}>
    <Link className="premium-offer__image" to={buildStorePreviewPath(buildStorefrontPath(store.slug, `/offers/${offer.id}`))}>
      {image && <img src={image} alt={offer.items[0].productName} loading="lazy" decoding="async" />}
      {saving > 0 && <span className="premium-offer__saving">{t("وفر {0}%", saving)}</span>}
    </Link>
    <div className="premium-offer__content">
      <span className="premium-offer__eyebrow">{t("بريميوم أوفير")}</span>
      <h2>{offer.name}</h2>
      {offer.description && <p className="premium-offer__description">{offer.description}</p>}
      <div className="premium-offer__price"><strong>{formatCurrency(offer.bundlePrice, { locale })}</strong>
        {offer.regularPrice > offer.bundlePrice && <del>{formatCurrency(offer.regularPrice, { locale })}</del>}
      </div>
      <div className="premium-offer__timer">
        <p>{t("ينتهي العرض خلال")}</p>
        <div className="premium-offer__countdown" role="timer" aria-live="off">
          {units.map(([value, label]) => <div key={label}><strong>{value.toLocaleString(locale, { minimumIntegerDigits: 2 })}</strong><span>{label}</span></div>)}
        </div>
      </div>
      {add.isError && <Alert severity="error">{extractApiError(add.error, t("تعذر إضافة الباكيج"))}</Alert>}
      {add.isSuccess && <Alert severity="success">{t("تمت إضافة الباكيج للسلة")}</Alert>}
      <div className="premium-offer__actions">
        {!store.isCatalog && <AppButton variant="contained" disabled={disabled || add.isPending}
          onClick={() => add.mutate(offer)}>{add.isPending ? t("جارٍ الإضافة...") : t("احصل على العرض")}</AppButton>}
        <AppButton component={Link} variant="outlined" to={buildStorePreviewPath(buildStorefrontPath(store.slug, `/offers/${offer.id}`))}>{t("تفاصيل العرض")}</AppButton>
      </div>
    </div>
  </section>;
}
