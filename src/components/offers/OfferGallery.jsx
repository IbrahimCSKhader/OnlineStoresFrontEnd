import { useState } from "react";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import "./OfferGallery.css";
export default function OfferGallery({ images = [], title = "" }) {
  const [selected, setSelected] = useState(0);
  const urls = [...new Set(images.filter(Boolean))];
  const active = selected < urls.length ? selected : 0;
  if (!urls.length) return null;
  return <div className="offer-gallery">
    <img className="offer-gallery__main" src={resolveAssetUrl(urls[active])} alt={title} />
    {urls.length > 1 && <div className="offer-gallery__thumbs">{urls.map((url, index) => <button type="button" key={url} aria-label={`${title} — ${index + 1}`} aria-pressed={active === index} onClick={() => setSelected(index)}><img src={resolveAssetUrl(url)} alt="" loading="lazy" /></button>)}</div>}
  </div>;
}
