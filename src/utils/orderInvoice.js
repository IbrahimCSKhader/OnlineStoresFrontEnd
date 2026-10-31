import { normalizeEntityResponse } from "./collections.js";
import { normalizeOrderDetails } from "./orders.js";
import { resolveAssetUrl } from "./assetUrl.js";
import { formatCurrency } from "./formatCurrency.js";

const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const cents = value => Math.round((Number(value) + Number.EPSILON) * 100);
function amount(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
}

export function invoiceAmounts(data) {
  const raw = normalizeEntityResponse(data) ?? data ?? {};
  const order = normalizeOrderDetails(raw);
  const items = order.items.map(item => ({ ...item, extendedPrice: cents(item.unitPrice * item.quantity) / 100 }));
  const lines = items.reduce((sum, item) => sum + cents(item.extendedPrice), 0) / 100;
  const subtotal = amount(raw.subTotal, raw.subtotal, order.subtotal);
  const discount = amount(raw.discountAmount, raw.discount, order.discount);
  const delivery = amount(raw.deliveryCost);
  // Preserve recorded totals, including fully discounted orders (zero is a valid total).
  const total = amount(raw.totalAmount, raw.finalTotal, raw.grandTotal, subtotal - discount + delivery);
  return { order, items, subtotal, discount, delivery, total, adjustment: (cents(subtotal) - cents(lines)) / 100, discountPercentage: subtotal > 0 ? discount / subtotal * 100 : 0 };
}

export function buildOrderInvoice({ data, store, owner, t, locale = "ar-u-nu-latn", dir = "rtl", showProductImages = false }) {
  const a = invoiceAmounts(data);
  const { order, items } = a;
  const text = value => escape(t(value));
  const money = value => escape(formatCurrency(value, { locale }));
  const number = value => escape(new Intl.NumberFormat(locale, { maximumFractionDigits: 2, numberingSystem: "latn" }).format(value));
  const date = new Date(order.createdAt);
  const dateText = Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric", numberingSystem: "latn" }).format(date);
  const seller = [owner?.firstName, owner?.lastName].filter(Boolean).join(" ") || owner?.fullName || owner?.name || owner?.email || "—";
  const logoUrl = resolveAssetUrl(store?.logoUrl);
  const logo = /^https?:\/\//i.test(logoUrl) ? `<img class="logo" src="${escape(logoUrl)}" alt="${escape(store?.name)}" />` : "";
  const detail = (label, value) => `<div class="detail"><span>${text(label)}</span><strong>${escape(value || "—")}</strong></div>`;
  const imageCell = item => {
    if (!showProductImages) return "";
    const url = [item.effectiveVariantImageUrl, item.variantImageUrl, item.productImageUrl, item.product?.thumbnailUrl]
      .map(resolveAssetUrl).find(url => /^https?:\/\//i.test(url));
    return `<td class="image-cell">${url ? `<img class="product-image" src="${escape(url)}" alt="${escape(item.productName)}" />` : '<span class="image-placeholder">—</span>'}</td>`;
  };
  const columnWidths = showProductImages ? [17, 12, 29, 8, 17, 17] : [20, 31, 9, 20, 20];
  const totalRow = (label, value, css = "") => `<div class="sum ${css}"><span>${text(label)}</span><strong dir="ltr">${money(value)}</strong></div>`;
  return `<!doctype html><html lang="${escape(locale)}" dir="${dir === "ltr" ? "ltr" : "rtl"}"><head><meta charset="utf-8"><title>${text("فاتورة الطلب")} ${escape(order.orderNumber)}</title>
<style>
@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:13px/1.65 Arial,Tahoma,sans-serif;color:#18252c;background:white;margin:0;padding:24px}header{display:flex;align-items:center;justify-content:space-between;gap:24px;border-bottom:3px solid #17695c;padding-bottom:20px}.brand{display:flex;align-items:center;gap:16px}.logo{width:76px;height:76px;object-fit:contain}h1{font-size:24px;margin:0}h2{font-size:19px;margin:0;color:#17695c}.reference{max-width:50%;overflow-wrap:anywhere}.reference p{margin:4px 0}.info{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:24px 0}.card{border:1px solid #d8e2e0;border-radius:6px;padding:14px}.card h3{margin:0 0 10px;color:#17695c}.detail{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between}.detail span{color:#52636c}.detail strong{overflow-wrap:anywhere;max-width:100%}table{width:100%;border-collapse:collapse;table-layout:fixed}th{background:#edf4f2;text-align:start;font-size:12px}th,td{padding:10px 7px;border-bottom:1px solid #d8e2e0;vertical-align:top;overflow-wrap:anywhere}.image-cell{text-align:center;vertical-align:middle}.product-image,.image-placeholder{display:inline-block;width:56px;height:56px;max-width:100%;aspect-ratio:1;object-fit:contain;border:1px solid #d8e2e0;border-radius:4px;background:white}.image-placeholder{line-height:56px;color:#52636c}.id{font-size:10px;direction:ltr;unicode-bidi:isolate}.num{white-space:nowrap;direction:ltr;unicode-bidi:isolate}small{display:block;color:#52636c}.totals{width:52%;margin-inline-start:auto;margin-top:24px;break-inside:avoid}.sum{display:flex;justify-content:space-between;gap:16px;padding:6px 0;border-bottom:1px solid #e4ebe9}.grand{font-size:18px;color:#17695c;border-top:2px solid #17695c;padding-top:12px}.notes{margin-top:24px;white-space:pre-wrap;overflow-wrap:anywhere}.foot{margin-top:28px;color:#52636c;font-size:11px}thead{display:table-header-group}tr{break-inside:avoid}@media print{body{padding:0}header{break-inside:avoid}th{print-color-adjust:exact;-webkit-print-color-adjust:exact}}@media screen and (max-width:600px){body{padding:12px}.info{grid-template-columns:1fr}.totals{width:100%}th,td{padding:6px 3px}.num{white-space:normal}}
</style></head><body>
<header><div class="brand">${logo}<div><h1>${escape(store?.name || "—")}</h1><h2>${text("فاتورة الطلب")}</h2></div></div><div class="reference">${detail("رقم الطلب", order.orderNumber)}${detail("تاريخ الطلب", dateText)}</div></header>
<section class="info"><div class="card"><h3>${text("بيانات العميل")}</h3>${detail("اسم العميل", order.customerName || order.customerEmail)}${detail("البريد الإلكتروني", order.customerEmail)}${detail("الهاتف", order.customerPhone || order.deliveryPhone)}${detail("عنوان التوصيل", [order.deliveryCity, order.deliveryAddress].filter(Boolean).join("، "))}</div><div class="card"><h3>${text("بيانات التاجر")}</h3>${detail("اسم التاجر", seller)}${detail("اسم المتجر", store?.name)}${detail("البريد الإلكتروني", owner?.email)}${detail("معرف الطلب", order.id)}</div></section>
<table><colgroup>${columnWidths.map(width => `<col style="width:${width}%">`).join("")}</colgroup><thead><tr>${["معرف المنتج", ...(showProductImages ? ["صورة المنتج"] : []), "المنتج", "الكمية", "سعر القطعة", "إجمالي البند"].map(label => `<th scope="col">${text(label)}</th>`).join("")}</tr></thead><tbody>${items.map(item => `<tr><td class="id">${escape(item.productId || "—")}${item.variantSku ? `<small>SKU: ${escape(item.variantSku)}</small>` : ""}</td>${imageCell(item)}<td>${escape(item.productName)}${item.variantName && item.variantName !== "Default" ? `<small>${escape(item.variantName)}</small>` : ""}${item.bundleName ? `<small>${text("باكيج")}: ${escape(item.bundleName)}</small>` : ""}</td><td>${number(item.quantity)}</td><td><bdi class="num">${money(item.unitPrice)}</bdi></td><td><bdi class="num">${money(item.extendedPrice)}</bdi></td></tr>`).join("")}</tbody></table>
<section class="totals">${a.adjustment ? totalRow("تسوية إجمالي البنود", a.adjustment) : ""}${totalRow("الإجمالي قبل الخصم", a.subtotal)}<div class="sum"><span>${text("نسبة خصم الطلب")}</span><strong dir="ltr">${number(a.discountPercentage)}%</strong></div>${totalRow("قيمة خصم الطلب", -a.discount)}${order.couponCode ? detail("كود الخصم", order.couponCode) : ""}${totalRow("تكلفة التوصيل", a.delivery)}${totalRow("الإجمالي النهائي", a.total, "grand")}</section>
${order.customerNotes ? `<p class="notes"><strong>${text("ملاحظات العميل")}</strong><br>${escape(order.customerNotes)}</p>` : ""}${order.storeNotes ? `<p class="notes"><strong>${text("ملاحظات المتجر")}</strong><br>${escape(order.storeNotes)}</p>` : ""}<p class="foot">${text("الأسعار حسب الطلب وقت الشراء. نسبة خصم الطلب محسوبة من الخصم المسجل، وأسعار البنود تشمل خصوماتها المطبقة.")}</p>
</body></html>`;
}
