import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import StoreDetails from "./StoreDetails.jsx";
import ProductDetails from "./ProductDetails.jsx";
import Cart from "../customer/Cart.jsx";
import Checkout from "../customer/Checkout.jsx";

const state = vi.hoisted(() => ({ signedIn: false, store: {}, product: { id: "p", storeId: "s", name: "Sample product", price: 20, status: 1, stockQuantity: 10 } }));
const cartAdd = vi.hoisted(() => vi.fn(async () => ({})));
vi.mock("../../hooks/stores/useStoreBySlug.js", () => ({ default: () => ({ data: state.store }) }));
vi.mock("../../hooks/products/useProductDetails.js", () => ({ default: () => ({ data: state.product }) }));
vi.mock("../../hooks/products/useProductsByCategory.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/products/useProductsBySection.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/products/useStorefrontCatalogProducts.js", () => ({ default: () => ({ data: [state.product], pagination: {} }) }));
vi.mock("../../hooks/products/useFeaturedProducts.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/products/useHighlightProducts.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/categories/useCategories.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ language: "A", t: text => text }) }));
vi.mock("../../hooks/stores/useOwnerStorePreview.js", () => ({ default: () => ({ isOwnerPreview: false, previewSearch: "", buildStorePreviewPath: x => x }) }));
vi.mock("../../hooks/auth/useAuth.js", () => ({ default: () => ({ isAuthenticated: state.signedIn, storeCustomer: state.signedIn ? { id: "customer" } : null }) }));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: () => ({ hasScopedStorefrontSession: state.signedIn, useLocalGuestCart: !state.signedIn }) }));
vi.mock("../../hooks/cart/useCart.js", () => ({ default: () => ({ data: { items: [] } }) }));
vi.mock("../../hooks/cart/useAddToCart.js", () => ({ default: () => ({ mutate: cartAdd, mutateAsync: cartAdd }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../API/store.api.js", () => ({ default: { visitStore: async () => ({}) } }));
vi.mock("../../API/product.api.js", () => ({ default: { visitProduct: async () => ({}) } }));
afterEach(cleanup);
function show(Component, isCatalog, path = "/market/demo/product/p", signedIn = false) {
  state.signedIn = signedIn;
  state.store = { id: "s", slug: "demo", name: "Demo", isCatalog };
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/market/:slug/product/:productId" element={<Component />} />
      <Route path="/market/:slug/cart" element={<Component />} />
      <Route path="/market/:slug/checkout" element={<Component />} />
      <Route path="/market/:slug" element={<p>Catalog home</p>} />
    </Routes>
  </MemoryRouter></QueryClientProvider>);
}
it.each([[false, false], [false, true], [true, false], [true, true]])("store product cards respect catalog=%s, signedIn=%s", (isCatalog, signedIn) => {
  show(StoreDetails, isCatalog, undefined, signedIn);
  expect(screen.getByText("Sample product")).toBeInTheDocument();
  expect(screen.queryAllByRole("button", { name: "أضف" }).length > 0).toBe(!isCatalog);
  expect(screen.queryAllByRole("link", { name: "السلة" }).length > 0).toBe(!isCatalog);
});
it("store home cards submit the selected quantity and reset after success", async () => {
  cartAdd.mockClear();
  show(StoreDetails, false);
  const card = within(screen.getByText("Sample product").closest(".product-card"));
  fireEvent.click(card.getByRole("button", { name: "زيادة الكمية" }));
  fireEvent.click(card.getByRole("button", { name: "زيادة الكمية" }));
  fireEvent.click(card.getByRole("button", { name: "زيادة الكمية" }));
  fireEvent.click(card.getByRole("button", { name: "أضف" }));
  await waitFor(() => expect(cartAdd).toHaveBeenCalledWith(expect.objectContaining({ productId: "p", quantity: 3 })));
  await waitFor(() => expect(card.getByLabelText("الكمية", { selector: "output" })).toHaveTextContent("0"));
});
it.each([[false, false], [false, true], [true, false], [true, true]])("product details respect catalog=%s, signedIn=%s while keeping sharing", (isCatalog, signedIn) => {
  show(ProductDetails, isCatalog, undefined, signedIn);
  expect(screen.getByRole("button", { name: "مشاركة" })).toBeInTheDocument();
  expect(Boolean(screen.queryByRole("button", { name: "أضف إلى السلة" }))).toBe(!isCatalog);
  expect(Boolean(screen.queryByRole("link", { name: "اذهب إلى الدفع" }))).toBe(!isCatalog);
});
it.each([[Cart, "cart", false], [Cart, "cart", true], [Checkout, "checkout", false], [Checkout, "checkout", true]])("redirects catalog purchase URLs", (Component, suffix, signedIn) => {
  show(Component, true, `/market/demo/${suffix}`, signedIn);
  expect(screen.getByText("Catalog home")).toBeInTheDocument();
});
