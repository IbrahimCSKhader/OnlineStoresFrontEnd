import formatCurrency from "../../utils/formatCurrency.js";
import "./Offers.css";
export default function BundleOrderSummary({ items = [], t = value => value }) {
  const groups = new Map();
  for (const item of items) {
    if (!item.bundleGroupId) continue;
    const rows = groups.get(item.bundleGroupId) || []; rows.push(item); groups.set(item.bundleGroupId, rows);
  }
  if (!groups.size) return null;
  return <div className="bundle-order-summary">{[...groups].map(([id, rows]) => <div key={id}>
    <strong>{t("باكيج")}: {rows[0].bundleName}</strong>
    <span> × {rows[0].bundleQuantity} — {formatCurrency(rows[0].bundlePrice * rows[0].bundleQuantity)}</span>
    <p>{rows.map(row => `${row.productName} × ${row.bundleItemQuantity}`).join(" + ")}</p>
  </div>)}</div>;
}
