import { useState } from "react";
import ImageNotSupportedOutlined from "@mui/icons-material/ImageNotSupportedOutlined";
import { resolveAssetUrl } from "../../utils/assetUrl.js";

export default function OrderProductImage({ item, size = 64 }) {
  const [failedSources, setFailedSources] = useState([]);
  const source = [item?.effectiveVariantImageUrl, item?.variantImageUrl, item?.productImageUrl, item?.imageUrl, item?.product?.thumbnailUrl]
    .filter(value => typeof value === "string" && value.trim())
    .map(resolveAssetUrl)
    .find(value => !failedSources.includes(value));
  const style = { width: size, height: size, flexShrink: 0, objectFit: "contain", borderRadius: 8, background: "var(--surface, #f4f5f4)" };
  return source
    ? <img src={source} alt={item?.productName || ""} loading="lazy" style={style} onError={() => setFailedSources(previous => [...previous, source])} />
    : <span aria-hidden="true" style={{ ...style, display: "grid", placeItems: "center" }}><ImageNotSupportedOutlined color="disabled" /></span>;
}
