import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import StoreDetails from "./StoreDetails.jsx";
import ProductDetails from "./ProductDetails.jsx";
import Cart from "../customer/Cart.jsx";
import Checkout from "../customer/Checkout.jsx";

const state = vi.hoisted(() => ({ store: {}, product: { id: "p", storeId: "s", name: "Sample product", price: 20, status: 1, stockQuantity: 10 } }));
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
vi.mock("../../hooks/auth/useAuth.js", () => ({ default: () => ({}) }));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: () => ({}) }));
vi.mock("../../hooks/cart/useCart.js", () => ({ default: () => ({ data: { items: [] } }) }));
vi.mock("../../hooks/cart/useAddToCart.js", () => ({ default: () => ({ mutate: vi.fn() }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../API/store.api.js", () => ({ default: { visitStore: async () => ({}) } }));
vi.mock("../../API/product.api.js", () => ({ default: { visitProduct: async () => ({}) } }));
afterEach(cleanup);
function show(Component, isCatalog, path = "/market/demo/product/p") {
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
it.each([false, true])("store product cards respect isCatalog=%s", isCatalog => {
  show(StoreDetails, isCatalog);
  expect(screen.getByText("Sample product")).toBeInTheDocument();
  expect(screen.queryAllByRole("button", { name: "أضف" }).length > 0).toBe(!isCatalog);
  expect(screen.queryAllByRole("link", { name: "السلة" }).length > 0).toBe(!isCatalog);
});
it.each([false, true])("product details respect isCatalog=%s while keeping sharing", isCatalog => {
  show(ProductDetails, isCatalog);
  expect(screen.getByRole("button", { name: "مشاركة" })).toBeInTheDocument();
  expect(Boolean(screen.queryByRole("button", { name: "أضف إلى السلة" }))).toBe(!isCatalog);
  expect(Boolean(screen.queryByRole("link", { name: "اذهب إلى الدفع" }))).toBe(!isCatalog);
});
it.each([[Cart, "cart"], [Checkout, "checkout"]])("redirects catalog purchase URLs", (Component, suffix) => {
  show(Component, true, `/market/demo/${suffix}`);
  expect(screen.getByText("Catalog home")).toBeInTheDocument();
});
