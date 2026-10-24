import { expect, it } from "vitest";
import { emptyOrderFilters, filterStoreOrders, orderCustomerKey } from "./orderFilters.js";
const orders = [
  { id: "1", customerId: "a", customerName: "Alice", customerEmail: "a@example.com", customerPhone: "059123", createdAt: "2026-10-25T23:59:59" },
  { id: "2", customerId: "b", customerName: "Bob", createdAt: "2026-10-24T12:00:00" },
  { id: "3", customerId: "a", customerName: "Alice", createdAt: "2026-10-25T00:00:00" },
  { id: "4", customerId: "c", customerName: "Alice", createdAt: "2026-10-26T10:00:00" },
];
const select = changes => filterStoreOrders(orders, { ...emptyOrderFilters, ...changes }, "en").map(x => x.id);
it("groups clients with identical names separately and sorts each client's latest orders first", () => {
  expect(select({})).toEqual(["1", "3", "4", "2"]);
  expect(orderCustomerKey(orders[0])).not.toBe(orderCustomerKey(orders[3]));
  expect(orders.map(x => x.id)).toEqual(["1", "2", "3", "4"]);
});
it("combines customer name/email/phone terms and inclusive dates", () => {
  expect(select({ customer: "alice A@example 059", from: "2026-10-25", to: "2026-10-25" })).toEqual(["1"]);
  expect(select({ from: "2026-10-25", to: "2026-10-25" })).toEqual(["1", "3"]);
});
it("supports an open-ended range and both date sorting directions", () => {
  expect(select({ to: "2026-10-24" })).toEqual(["2"]);
  expect(select({ from: "2026-10-26" })).toEqual(["4"]);
  expect(select({ sort: "newest" })).toEqual(["4", "1", "3", "2"]);
  expect(select({ sort: "oldest" })).toEqual(["2", "3", "1", "4"]);
});
it("returns no matches for reversed dates and excludes invalid dates only when filtering dates", () => {
  expect(select({ from: "2026-10-26", to: "2026-10-24" })).toEqual([]);
  const list = [{ customerName: "Test", createdAt: "invalid" }];
  expect(filterStoreOrders(list, emptyOrderFilters)).toHaveLength(1);
  expect(filterStoreOrders(list, { ...emptyOrderFilters, from: "2026-10-25" })).toHaveLength(0);
});
it("matches Arabic names with or without diacritics", () => {
  expect(filterStoreOrders([{ customerName: "مُحَمَّد" }], { ...emptyOrderFilters, customer: "محمد" })).toHaveLength(1);
});
