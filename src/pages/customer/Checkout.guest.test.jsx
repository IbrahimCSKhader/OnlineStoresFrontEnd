import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import Checkout from "./Checkout.jsx";

const state = vi.hoisted(() => ({ required: false, signedIn: false, create: vi.fn(), clear: vi.fn(), replace: vi.fn() }));
vi.mock("../../hooks/stores/useStoreBySlug.js", () => ({ default: () => ({ data: { id: "store", slug: "demo", name: "Demo", whatsAppNumber: "970591234567", requireCustomerLoginForCheckout: state.required } }) }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ language: "A", t: (text, ...args) => text.replace(/\{(\d+)\}/g, (_, n) => args[n] ?? "") }) }));
vi.mock("../../hooks/auth/useAuth.js", () => ({ default: () => ({ storeCustomer: state.signedIn ? { id: "customer" } : null }) }));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: () => ({ hasScopedStorefrontSession: state.signedIn, useLocalGuestCart: !state.signedIn }) }));
vi.mock("../../hooks/auth/useCustomerProfile.js", () => ({ default: () => ({ data: state.signedIn ? { firstName: "Registered", lastName: "Customer", email: "test@example.com", phone: "0591234567", address: "Street", city: "City" } : undefined }) }));
vi.mock("../../hooks/cart/useCart.js", () => ({ default: () => ({ data: { items: [{ id: "line", productId: "product", name: "Product", quantity: 2, unitPrice: 25, totalPrice: 50 }] } }) }));
vi.mock("../../hooks/cart/useClearCart.js", () => ({ default: () => ({ mutateAsync: state.clear }) }));
vi.mock("../../hooks/orders/useCreateOrder.js", () => ({ default: () => ({ mutateAsync: state.create }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../components/cart/CartItem.jsx", () => ({ default: () => <span>Product</span> }));

beforeEach(() => {
  state.required = false; state.signedIn = false;
  state.create.mockReset().mockResolvedValue({ id: "order", orderNumber: "ORD-1", isGuest: true, customerName: "Guest", totalAmount: 50, items: [{ productName: "Product", quantity: 2, unitPrice: 25, totalPrice: 50 }] });
  state.clear.mockReset().mockResolvedValue({});
  state.replace.mockReset();
  vi.spyOn(window, "open").mockImplementation(() => ({ closed: false, location: { replace: state.replace }, focus: vi.fn(), close: vi.fn() }));
});
function show() {
  render(<MemoryRouter initialEntries={["/market/demo/checkout"]}><Routes>
    <Route path="/market/:slug/checkout" element={<Checkout />} />
    <Route path="/market/:slug/login" element={<div>Store login screen</div>} />
  </Routes></MemoryRouter>);
}
function fill() {
  for (const [label, value] of [["اسم العميل", "Guest"], ["عنوان التوصيل", "Street"], ["المدينة", "City"], ["رقم الهاتف", "0591234567"]])
    fireEvent.change(screen.getByRole("textbox", { name: new RegExp(label) }), { target: { value } });
}

it("creates a guest order with contact details and opens WhatsApp without login", async () => {
  show(); fill();
  fireEvent.click(screen.getByRole("button", { name: "التالي" }));
  fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب عبر واتساب" }));
  await waitFor(() => expect(state.create).toHaveBeenCalledWith(expect.objectContaining({ customerName: "Guest", deliveryPhone: "0591234567", deliveryAddress: "Street", guestItems: [{ productId: "product", quantity: 2 }] })));
  await waitFor(() => expect(state.replace).toHaveBeenCalled());
  const message = decodeURIComponent(state.replace.mock.calls[0][0]);
  expect(message).toContain("Guest"); expect(message).toContain("0591234567"); expect(message).toContain("غير مسجل");
  expect(state.clear).toHaveBeenCalled();
});

it("requires store login when the store requires registration", async () => {
  state.required = true; show(); fill();
  fireEvent.click(screen.getByRole("button", { name: "التالي" }));
  fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب عبر واتساب" }));
  expect(await screen.findByText("Store login screen")).toBeInTheDocument();
  expect(state.create).not.toHaveBeenCalled();
});

it("prefills registered customer data and uses their server cart", async () => {
  state.signedIn = true; show();
  expect(screen.getByRole("textbox", { name: /اسم العميل/ })).toHaveValue("Registered Customer");
  fireEvent.click(screen.getByRole("button", { name: "التالي" }));
  fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب عبر واتساب" }));
  await waitFor(() => expect(state.create).toHaveBeenCalled());
  expect(state.create.mock.calls[0][0].guestItems).toBeUndefined();
});

it("does not clear the cart or send WhatsApp if order creation fails", async () => {
  state.create.mockRejectedValue(new Error("unavailable")); show(); fill();
  fireEvent.click(screen.getByRole("button", { name: "التالي" }));
  fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب عبر واتساب" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  expect(state.replace).not.toHaveBeenCalled(); expect(state.clear).not.toHaveBeenCalled();
});
