import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import StoreDetails from "./StoreDetails.jsx";
const state = vi.hoisted(() => ({ template: "C", categories: Array.from({ length: 13 }, (_, i) => ({ id: `brand-${i}`, name: `Brand ${i}`, imageUrl: `/brand-${i}.jpg` })) }));
vi.mock("../../hooks/stores/useStoreBySlug.js", () => ({ default: () => ({ data: { id: "s", slug: "demo", name: "Demo", description: "Author books", storeStory: "Author story", themeTemplate: state.template } }) }));
vi.mock("../../hooks/stores/useOwnerStorePreview.js", () => ({ default: () => ({ isOwnerPreview: true, previewSearch: "?preview=1", buildStorePreviewPath: x => `${x}?preview=1` }) }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ t: x => x, language: "A" }) }));
vi.mock("../../hooks/categories/useCategories.js", () => ({ default: () => ({ data: state.categories }) }));
vi.mock("../../hooks/products/useStorefrontCatalogProducts.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/products/useFeaturedProducts.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/products/useHighlightProducts.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/offers/useOffers.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/cart/useAddToCart.js", () => ({ default: () => ({}) }));
vi.mock("../../components/store/StoreStatistics.jsx", () => ({ default: () => null }));
vi.mock("../../components/offers/PremiumOffer.jsx", () => ({ default: () => null }));
vi.mock("../../components/offers/StoreOffers.jsx", () => ({ default: () => null }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
afterEach(cleanup);
const show = () => render(<MemoryRouter initialEntries={["/market/demo"]}><Routes>
  <Route path="/market/:slug" element={<StoreDetails />} />
  <Route path="/market/:slug/category/:categoryId" element={<p>Category products</p>} />
</Routes></MemoryRouter>);
it("shows every category as a linked tile, preserving preview navigation", () => {
  state.template = "C";
  const { container } = show();
  expect(container.querySelectorAll(".page-store-details__category-card")).toHaveLength(13);
  expect(container.querySelectorAll(".page-store-details__category-tile-image")).toHaveLength(13);
  expect(screen.queryByText("جميع المنتجات")).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "Brand 12" }));
  expect(screen.getByText("Category products")).toBeVisible();
});
it("retains the existing storefront for other templates", () => {
  state.template = "N";
  const { container } = show();
  expect(container.querySelectorAll(".page-store-details__category-card")).toHaveLength(13);
  expect(screen.getByText("جميع المنتجات")).toBeVisible();
});

it("renders the library layout from the saved template while keeping the catalog", () => {
  state.template = "K";
  const { container } = show();
  expect(container.querySelector(".page-store-details--library")).not.toBeNull();
  expect(screen.getByText("Author story")).toBeVisible();
  expect(container.querySelector(".page-store-details__categories-grid")).toBeNull();
  expect(screen.getByText("رفوف المكتبة")).toBeVisible();
  expect(container.querySelector(".page-store-details__featured")).toBeNull();
});
