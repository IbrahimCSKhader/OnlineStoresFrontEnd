import { expect, it } from "vitest";
import { buildGuestOrderItems } from "./guestCheckout.js";

it("only sends identifiers and quantities, never browser prices", () => {
  expect(buildGuestOrderItems([{ productId: "p", variantId: "v", quantity: 2, unitPrice: 0.01 }])).toEqual([{ productId: "p", variantId: "v", quantity: 2 }]);
});
it("expands a local bundle into inventory-bearing components", () => {
  const rows = buildGuestOrderItems([{ bundleOfferId: "b", quantity: 2, bundleComponents: [{ productId: "p", requiredQuantity: 3 }, { productId: "q", requiredQuantity: 1 }] }]);
  expect(rows.map((r) => r.quantity)).toEqual([6, 2]);
  expect(rows[0].bundleGroupId).toBe(rows[1].bundleGroupId);
  expect(rows[0].bundleQuantity).toBe(2);
  expect(rows[0].bundlePrice).toBeUndefined();
});
