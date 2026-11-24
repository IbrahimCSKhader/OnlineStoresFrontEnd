import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import Checkout from "./Checkout.jsx";

const state = vi.hoisted(() => ({ required: false, signedIn: false, instagramOnly: false, inquiry: false, create: vi.fn(), clear: vi.fn(), replace: vi.fn() }));
vi.mock("../../hooks/stores/useStoreBySlug.js", () => ({ default: () => ({ data: { id: "store", slug: "demo", name: "Demo", themeTemplate: state.inquiry ? "K" : "D", whatsAppNumber: state.instagramOnly ? "" : "970591234567", contactAccounts: state.instagramOnly ? [{ platform: "Instagram", username: "alaa_rob_" }] : [], requireCustomerLoginForCheckout: state.required } }) }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ language: "A", t: (text, ...args) => text.replace(/\{(\d+)\}/g, (_, n) => args[n] ?? "") }) }));
vi.mock("../../hooks/auth/useAuth.js", () => ({ default: () => ({ storeCustomer: state.signedIn ? { id: "customer" } : null }) }));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: () => ({ hasScopedStorefrontSession: state.signedIn, useLocalGuestCart: !state.signedIn }) }));
vi.mock("../../hooks/auth/useCustomerProfile.js", () => ({ default: () => ({ data: state.signedIn ? { firstName: "Registered", lastName: "Customer", email: "test@example.com", phone: "0591234567", address: "Street", city: "City" } : undefined }) }));
vi.mock("../../hooks/cart/useCart.js", () => ({ default: () => ({ data: { items: [{ id: "line", productId: "product", name: "Product", quantity: 2, unitPrice: state.inquiry ? 0 : 25, totalPrice: state.inquiry ? 0 : 50, isPriceOnRequest: state.inquiry }] } }) }));
vi.mock("../../hooks/cart/useClearCart.js", () => ({ default: () => ({ mutateAsync: state.clear }) }));
vi.mock("../../hooks/orders/useCreateOrder.js", () => ({ default: () => ({ mutateAsync: state.create }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../components/cart/CartItem.jsx", () => ({ default: () => <span>Product</span> }));

beforeEach(() => {
  state.required = false; state.signedIn = false; state.instagramOnly = false; state.inquiry = false;
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
  const email = screen.getByRole("textbox", { name: /البريد الإلكتروني/ });
  expect(email).toHaveValue("");
  expect(email).not.toBeRequired();
  fireEvent.click(screen.getByRole("button", { name: "التالي" }));
  fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب عبر واتساب" }));
  await waitFor(() => expect(state.create).toHaveBeenCalledWith(expect.objectContaining({ customerName: "Guest", deliveryPhone: "0591234567", deliveryAddress: "Street", guestItems: [{ productId: "product", quantity: 2 }] })));
  expect(state.create.mock.calls[0][0].customerEmail).toBeUndefined();
  await waitFor(() => expect(state.replace).toHaveBeenCalled());
  const message = decodeURIComponent(state.replace.mock.calls[0][0]);
  expect(message).toContain("Guest"); expect(message).toContain("0591234567"); expect(message).toContain("غير مسجل");
  expect(state.clear).toHaveBeenCalled();
});

it("opens Instagram messaging and keeps a copyable order summary when WhatsApp is absent", async () => {
  state.instagramOnly = true; show(); fill();
  fireEvent.click(screen.getByRole("button", { name: "التالي" }));
  fireEvent.click(screen.getByRole("button", { name: "إتمام الطلب عبر إنستغرام" }));
  await waitFor(() => expect(state.create).toHaveBeenCalled());
  await waitFor(() => expect(state.replace).toHaveBeenCalledWith("https://ig.me/m/alaa_rob_"));
  expect(screen.getByRole("textbox", { name: "ملخص الطلب" }).value).toContain("Guest");
});

it("sends a library inquiry order without presenting a zero price", async () => {
  state.instagramOnly = true; state.inquiry = true;
  state.create.mockResolvedValue({ id: "order", orderNumber: "ORD-2", isGuest: true, customerName: "Guest", totalAmount: 0, items: [{ productName: "Book", quantity: 2, unitPrice: 0, totalPrice: 0 }] });
  show(); fill();
  fireEvent.click(screen.getByRole("button", { name: "التالي" }));
  fireEvent.click(screen.getByRole("button", { name: "إتمام الطلب عبر إنستغرام" }));
  await waitFor(() => expect(state.create).toHaveBeenCalled());
  await waitFor(() => expect(state.replace).toHaveBeenCalledWith("https://ig.me/m/alaa_rob_"));
  const message = screen.getByRole("textbox", { name: "ملخص الطلب" }).value;
  expect(message).toContain("السعر عند الاستفسار");
  expect(message).toContain("السعر النهائي يُحدد بعد الاستفسار");
  expect(message).not.toContain("₪0");
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


it("shows a missing delivery address in a dismissible centered dialog", async () => {
  show(); fill();
  fireEvent.change(screen.getByRole("textbox", { name: /عنوان التوصيل/ }), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "التالي" }));
  fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب عبر واتساب" }));
  const dialog = await screen.findByRole("dialog", { name: "يرجى إدخال عنوان التوصيل قبل إرسال الطلب." });
  expect(dialog).toBeVisible();
  expect(state.create).not.toHaveBeenCalled();
  fireEvent.click(dialog.querySelector("button"));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
