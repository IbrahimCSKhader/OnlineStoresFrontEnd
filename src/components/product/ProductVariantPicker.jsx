import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import AppButton from "../common/buttons/AppButton.jsx";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { getVariantAttributeLabel, getVariantEffectiveImage, getVariantEffectivePrice } from "../../utils/products.js";
import "./ProductVariantPicker.css";

const colorNames = {
  black: "#171717", أسود: "#171717", اسود: "#171717", שחור: "#171717",
  white: "#ffffff", أبيض: "#ffffff", ابيض: "#ffffff", לבן: "#ffffff",
  red: "#c62828", أحمر: "#c62828", احمر: "#c62828", אדום: "#c62828",
  blue: "#2563eb", أزرق: "#2563eb", ازرق: "#2563eb", כחול: "#2563eb",
  green: "#22834e", أخضر: "#22834e", اخضر: "#22834e", ירוק: "#22834e",
  yellow: "#f5cf35", أصفر: "#f5cf35", اصفر: "#f5cf35", צהוב: "#f5cf35",
  orange: "#ed752f", برتقالي: "#ed752f", כתום: "#ed752f",
  pink: "#eb88b3", وردي: "#eb88b3", زهري: "#eb88b3", ורוד: "#eb88b3",
  purple: "#8051a5", بنفسجي: "#8051a5", סגול: "#8051a5",
  gray: "#898989", grey: "#898989", رمادي: "#898989", אפור: "#898989",
  brown: "#82583b", بني: "#82583b", חום: "#82583b",
  beige: "#d8c5a4", بيج: "#d8c5a4", "בז׳": "#d8c5a4",
  navy: "#1e3155", كحلي: "#1e3155", gold: "#c99f39", ذهبي: "#c99f39",
  silver: "#c0c0c0", فضي: "#c0c0c0",
};

function swatchColor(value) {
  const name = String(value || "").trim().toLowerCase();
  return colorNames[name] || (/^#[0-9a-f]{3,8}$/i.test(name) ? name :
    globalThis.CSS?.supports?.("color", name) ? name : null);
}

function attributeKey(attribute) {
  return String(attribute.attributeId || attribute.attributeName || "").trim();
}

function attributeValue(variant, key) {
  return String(variant?.attributeValues?.find(attribute => attributeKey(attribute) === key)?.value || "");
}

export default function ProductVariantPicker({ variants, selectedVariantId, product, allowClear = false, onClear, onChange }) {
  const { t } = useStorefrontLanguage();
  const activeVariants = (variants || []).filter(variant => variant.isActive !== false);
  if (!activeVariants.length) return null;

  const selected = activeVariants.find(variant => String(variant.id) === String(selectedVariantId));
  const available = variant => !product?.trackInventory || Number(variant.stockQuantity ?? 0) > 0;
  const groups = new Map();
  for (const variant of activeVariants) {
    for (const attribute of variant.attributeValues || []) {
      const key = attributeKey(attribute);
      if (!key || !attribute.value) continue;
      if (!groups.has(key)) groups.set(key, { key, name: attribute.attributeName || t("الخيار"), values: new Set() });
      groups.get(key).values.add(String(attribute.value));
    }
  }
  const attributeGroups = [...groups.values()].sort((a, b) =>
    Number(/color|colour|لون|צבע/i.test(b.name)) - Number(/color|colour|لون|צבע/i.test(a.name)));
  // Keep full variant buttons for products whose legacy options have no complete attribute matrix.
  const hasCompleteAttributes = attributeGroups.length > 0 && activeVariants.every(variant =>
    attributeGroups.every(group => attributeValue(variant, group.key)));
  const hasDifferentImages = new Set(activeVariants.map(variant => getVariantEffectiveImage(variant, product)).filter(Boolean)).size > 1;

  function chooseVariant(candidates) {
    const matches = candidates.filter(available);
    const matchScore = variant => attributeGroups.filter(group =>
      selected && attributeValue(variant, group.key) === attributeValue(selected, group.key)).length;
    const next = matches.sort((a, b) => matchScore(b) - matchScore(a))[0];
    if (next) onChange(next.id);
  }

  return <section className="variant-picker" aria-label={t("الأصناف المتاحة")}>
    <div className="variant-picker__heading">
      <strong>{t("الأصناف المتاحة")}</strong>
      {allowClear && <AppButton type="button" variant="text" size="small" onClick={onClear}>{t("عرض صور المنتج")}</AppButton>}
    </div>
    {hasCompleteAttributes ? attributeGroups.map((group, index) => <fieldset className="variant-picker__group" key={group.key}>
      <legend>{group.name}{selected && <span> · {attributeValue(selected, group.key)}</span>}</legend>
      <div className="variant-picker__options">
        {[...group.values].map(value => {
          const candidates = activeVariants.filter(variant => attributeValue(variant, group.key) === value &&
            attributeGroups.slice(0, index).every(previous => !selected ||
              attributeValue(variant, previous.key) === attributeValue(selected, previous.key)));
          const isAvailable = candidates.some(available);
          const isSelected = Boolean(selected && attributeValue(selected, group.key) === value);
          const color = /color|colour|لون|צבע/i.test(group.name) ? swatchColor(value) : null;
          const representative = candidates.find(available) || candidates[0] || activeVariants.find(variant => attributeValue(variant, group.key) === value);
          const isSize = /size|مقاس|حجم|מידה/i.test(group.name);
          const image = hasDifferentImages && !isSize ? resolveAssetUrl(getVariantEffectiveImage(representative, product)) : "";
          return <button type="button" key={value} disabled={!isAvailable} aria-pressed={isSelected}
            aria-label={`${group.name} ${value}${!isAvailable ? ` · ${t("غير متوفر")}` : ""}`}
            className={`variant-picker__option${image ? " variant-picker__option--image" : ""}`}
            onClick={() => chooseVariant(candidates)}>
            {image && <img src={image} alt="" loading="lazy" decoding="async" />}
            <span className="variant-picker__label">{color && <span className="variant-picker__swatch" style={{ backgroundColor: color }} />}{value}</span>
            {!isAvailable && <small>{t("غير متوفر")}</small>}
          </button>;
        })}
      </div>
    </fieldset>) : <div className="variant-picker__options">
      {activeVariants.map(variant => {
        const isAvailable = available(variant);
        const image = hasDifferentImages ? resolveAssetUrl(getVariantEffectiveImage(variant, product)) : "";
        return <button type="button" key={variant.id} disabled={!isAvailable}
          aria-pressed={String(variant.id) === String(selectedVariantId)}
          className={`variant-picker__option${image ? " variant-picker__option--image" : ""}`}
          onClick={() => onChange(variant.id)}>
          {image && <img src={image} alt="" loading="lazy" decoding="async" />}
          <span className="variant-picker__label">{variant.name}</span>
          {getVariantAttributeLabel(variant) && <small>{getVariantAttributeLabel(variant)}</small>}
          {!product?.isPriceOnRequest && <small>{formatCurrency(getVariantEffectivePrice(variant, product))}</small>}
          {!isAvailable && <small>{t("غير متوفر")}</small>}
        </button>;
      })}
    </div>}
  </section>;
}
