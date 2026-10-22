import { it, expect } from "vitest";
import { normalizeCartResponse } from "./storefront.js";
import { addGuestBundle, getGuestCart, updateGuestCartItem, removeGuestCartItem } from "./guestCart.js";
it("collapses bundle components into one cart line with exact totals and package quantity", () => {
  const row = { bundleGroupId: "group", bundleOfferId: "offer", bundleName: "Package", bundleQuantity: 2, bundlePrice: 10.01 };
  const cart = normalizeCartResponse({ subtotal: 20.02, finalTotal: 20.02, items: [
    { ...row, id: "a", productId: "a", productName: "A", quantity: 6, bundleItemQuantity: 3, availableStock: 30, totalPrice: 10.01 },
    { ...row, id: "b", productId: "b", productName: "B", quantity: 2, bundleItemQuantity: 1, availableStock: 8, totalPrice: 10.01 },
    { id: "single", productId: "a", productName: "A", quantity: 1, unitPrice: 30, totalPrice: 30 },
  ] });
  expect(cart.items).toHaveLength(2);
  const bundle = cart.items.find(i => i.bundleOfferId);
  expect(bundle.quantity).toBe(2); expect(bundle.totalPrice).toBe(20.02); expect(bundle.availableStock).toBe(8);
  expect(bundle.bundleComponents).toHaveLength(2);
  expect(bundle.productId).toBe("");
  expect(normalizeCartResponse(cart).items.find(i => i.bundleOfferId).bundleComponents).toHaveLength(2);
});
it("preserves local bundle identity while changing quantity and removes it as a unit", () => {
  localStorage.clear(); addGuestBundle("s", { id: "o", name: "Offer", bundlePrice: 10, availableBundles: 4,
    items: [{ productId: "p", productName: "P", requiredQuantity: 2 }] });
  const line = getGuestCart("s").items[0];
  updateGuestCartItem("s", line.id, { quantity: 3 });
  const cart = normalizeCartResponse(getGuestCart("s"));
  expect(cart.items[0].bundleOfferId).toBe("o"); expect(cart.items[0].name).toContain("Offer");
  expect(cart.totalAmount).toBe(30);
  removeGuestCartItem("s", line.id); expect(getGuestCart("s").items).toHaveLength(0);
});
