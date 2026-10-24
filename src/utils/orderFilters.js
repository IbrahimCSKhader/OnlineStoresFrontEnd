export const emptyOrderFilters = { customer: "", from: "", to: "", sort: "customer" };
export function orderCustomerKey(order) {
  return String(order.customerId || order.storeCustomerId || order.customerEmail || order.customerName || "");
}
function day(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const searchable = value => String(value || "").normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase().trim();
export function filterStoreOrders(orders, filters, locale = "ar") {
  if (filters.from && filters.to && filters.from > filters.to) return [];
  const terms = searchable(filters.customer).split(/\s+/).filter(Boolean);
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const time = order => new Date(order.createdAt).getTime() || 0;
  return orders.filter(order => {
    const customer = searchable([order.customerName, order.customerEmail, order.customerPhone, order.customerId, order.storeCustomerId].join(" "));
    const date = day(order.createdAt);
    return terms.every(term => customer.includes(term)) &&
      (!(filters.from || filters.to) || (date && (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to)));
  }).sort((a, b) => {
    if (filters.sort === "oldest") return time(a) - time(b);
    if (filters.sort === "newest") return time(b) - time(a);
    return collator.compare(a.customerName || a.customerEmail || "", b.customerName || b.customerEmail || "") ||
      collator.compare(orderCustomerKey(a), orderCustomerKey(b)) || time(b) - time(a);
  });
}
