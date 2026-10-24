import { describe, expect, it } from "vitest";
import { buildOrderInvoice, invoiceAmounts } from "./orderInvoice.js";
import { translateOwnerText } from "../i18n/ownerText.js";

const data = { id: "order-id", orderNumber: "ORD-42", createdAt: "2026-10-25T10:00:00", customerName: "Test Customer", items: [{ productId: "product-id", productName: "Food", quantity: 3, unitPrice: 20, totalPrice: 60 }], subTotal: 60, discountAmount: 12, deliveryCost: 5, totalAmount: 53 };
const build = (overrides = {}) => buildOrderInvoice({ data, store: { name: "Test Store", logoUrl: "/logo.png" }, owner: { firstName: "Test", lastName: "Owner" }, t: x => x, ...overrides });

describe("merchant invoice", () => {
  it("uses saved prices and calculates the recorded order discount rate with delivery", () => {
    expect(invoiceAmounts(data)).toMatchObject({ subtotal: 60, discount: 12, discountPercentage: 20, delivery: 5, total: 53, adjustment: 0 });
    expect(invoiceAmounts(data).items[0].extendedPrice).toBe(60);
    const html = build();
    for (const value of ["product-id", "Test Customer", "Test Owner", "Test Store", "ORD-42", "2026"]) expect(html).toContain(value);
  });
  it("keeps zero totals on fully discounted orders and ignores current customer discount settings", () => {
    expect(invoiceAmounts({ ...data, discountAmount: 60, deliveryCost: 0, totalAmount: 0, customerDiscountPercentage: 10 })).toMatchObject({ total: 0, discountPercentage: 100 });
  });
  it("reconciles rounded bundle unit prices with the stored subtotal without applying discounts twice", () => {
    const order = { ...data, items: [{ quantity: 3, unitPrice: 3.33, totalPrice: 10, bundleGroupId: "bundle" }], subTotal: 10, discountAmount: 2, deliveryCost: 0, totalAmount: 8 };
    expect(invoiceAmounts(order)).toMatchObject({ adjustment: 0.01, discount: 2, total: 8 });
    expect(invoiceAmounts(order).items[0].extendedPrice).toBe(9.99);
  });
  it("escapes customer input, notes, and unsafe image URLs", () => {
    const html = build({ data: { ...data, customerName: '<script>alert(1)</script>', customerNotes: '<img src=x onerror="alert(1)">' }, store: { name: "<Store>", logoUrl: "javascript:alert(1)" } });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('src="javascript:');
    expect(html).toContain("&lt;Store&gt;");
    expect(html).toContain("&lt;img");
  });
  it.each([["E", "en", "ltr", "Order invoice"], ["I", "he", "rtl", "חשבונית הזמנה"]])("translates invoice labels and direction for %s", (language, locale, dir, title) => {
    const html = build({ t: text => translateOwnerText(language, text), locale, dir });
    expect(html).toContain(`dir="${dir}"`);
    expect(html).toContain(title);
    expect(html).not.toContain("نسبة خصم الطلب");
    expect(html).toContain("Test Customer");
  });
});
