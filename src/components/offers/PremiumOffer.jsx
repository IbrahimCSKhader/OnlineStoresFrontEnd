import OfferGallery from "./OfferGallery.jsx";
import { exclusive, localized, availabilityText } from "../../utils/offerPresentation.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "@mui/material/Alert";
import AppButton from "../common/buttons/AppButton.jsx";
import useOffers from "../../hooks/offers/useOffers.js";
import useAddBundle from "../../hooks/offers/useAddBundle.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import { isPremiumOffer, offerDate } from "../../utils/offers.js";
import formatCurrency from "../../utils/formatCurrency.js";
import extractApiError from "../../utils/extractApiError.js";
import "./PremiumOffer.css";

export default function PremiumOffer({ store, disabled = false }) {
  const { t, locale, language } = useStorefrontLanguage();
  const offers = useOffers(store?.id);
  const add = useAddBundle(store);
  const { buildStorePreviewPath } = useOwnerStorePreview();
  const [now, setNow] = useState(() => Date.now());
  const settings = store?.appearance?.sections;
  const candidates = (offers.data || []).filter(offer => Number(offer.type) === 1 && (settings?.premiumOfferId ? offer.id === settings.premiumOfferId : isPremiumOffer(offer)) &&
    offer.isActive !== false && offerDate(offer.startDate).getTime() <= now &&
    offerDate(offer.endDate).getTime() > now && offer.items?.length && offer.availableBundles > 0);
  const offer = candidates.sort((a, b) => b.priority - a.priority || offerDate(b.createdAt) - offerDate(a.createdAt))[0];
  const hasTimedOffers = (offers.data || []).some(item => item.endDate);

  useEffect(() => {
    if (!hasTimedOffers) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasTimedOffers]);

  if (!offer || settings?.premiumEnabled === false) return null;
  const presentation = settings?.offers?.[offer.id];
  const title = localized(presentation?.title, language, offer.name);
  const duration = (offerDate(offer.endDate) - offerDate(offer.startDate)) / 3600000;
  const remaining = Math.max(0, Math.ceil((offerDate(offer.endDate).getTime() - now) / 1000));
  const units = [
    [Math.floor(remaining / 86400), t("يوم")],
    [Math.floor(remaining / 3600) % 24, t("ساعة")],
    [Math.floor(remaining / 60) % 60, t("دقيقة")],
    [remaining % 60, t("ثانية")],
  ];
  return <section className="premium-offer" aria-label={t("بريميوم أوفير")}>
    <OfferGallery key={offer.id} images={presentation?.images?.length ? presentation.images : offer.items.map(i => i.productImageUrl)} title={title} />
    <div className="premium-offer__content">
      <span className="premium-offer__eyebrow">{localized(presentation?.badge, language, exclusive[language] || exclusive.A)}</span>
      <h2 style={{ color: /^#[0-9a-f]{6}$/i.test(presentation?.titleColor || "") ? presentation.titleColor : undefined }}>{title}</h2>
      {duration > 0 && <div className="premium-offer__availability"><strong>{availabilityText(language,duration)}</strong><p>{offerDate(offer.startDate).toLocaleString(locale)} — {offerDate(offer.endDate).toLocaleString(locale)}</p></div>}
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
