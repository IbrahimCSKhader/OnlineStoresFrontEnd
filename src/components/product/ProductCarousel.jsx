import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import PauseRounded from "@mui/icons-material/PauseRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { getProductImage, getProductDisplayPrice } from "../../utils/products.js";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import formatCurrency from "../../utils/formatCurrency.js";
import "./ProductCarousel.css";

export default function ProductCarousel({ products, productPath }) {
  const { t, dir, locale } = useStorefrontLanguage();
  const [paused, setPaused] = useState(false);
  const [layout, setLayout] = useState({ width: 0, copies: 2 });
  const viewport = useRef(null);
  const group = useRef(null);
  useEffect(() => {
    if (!viewport.current || !group.current) return;
    const measure = () => {
      const width = group.current.getBoundingClientRect().width;
      if (width) setLayout({ width, copies: Math.max(2, Math.ceil(viewport.current.clientWidth / width) + 1) });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport.current);
    observer.observe(group.current);
    return () => observer.disconnect();
  }, [products.length]);
  if (!products.length) return null;
  const label = paused ? t("تشغيل الحركة") : t("إيقاف الحركة");
  return <section className="product-carousel" aria-label={t("مختارات المتجر")}>
    <header className="product-carousel__header">
      <h2>{t("مختارات المتجر")}</h2>
      {products.length > 1 && <Tooltip title={label}><IconButton aria-label={label} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <PlayArrowRounded /> : <PauseRounded />}</IconButton></Tooltip>}
    </header>
    <div ref={viewport} className="product-carousel__viewport" dir="ltr">
      <div className={`product-carousel__track${paused ? " is-paused" : ""}${products.length === 1 ? " is-static" : ""}`} style={{ "--travel": `${layout.width}px`, "--duration": `${Math.max(16, layout.width / 28)}s` }}>
        {Array.from({ length: products.length === 1 ? 1 : layout.copies }, (_, copy) =>
          <div key={copy} ref={copy === 0 ? group : undefined} className="product-carousel__group" aria-hidden={copy > 0 ? true : undefined}>
            {products.map(product => <Link key={product.id} to={productPath(product.id)} tabIndex={copy ? -1 : undefined} dir={dir} className="product-carousel__item">
              <img src={resolveAssetUrl(getProductImage(product))} alt={product.name} loading="lazy" />
              <span>{product.name}</span>
              <strong>{formatCurrency(getProductDisplayPrice(product), { locale })}</strong>
            </Link>)}
          </div>)}
      </div>
    </div>
  </section>;
}
