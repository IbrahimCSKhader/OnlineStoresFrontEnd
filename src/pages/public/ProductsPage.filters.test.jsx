import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ProductsPage from "./ProductsPage.jsx";

const state = vi.hoisted(() => ({ compact: true, add: vi.fn(),
  store: { id: "s", slug: "demo", name: "Demo" },
  products: [{ id: "p", name: "Tea", stockQuantity: 5, trackInventory: true, price: 10 }, { id: "p2", name: "Coffee", stockQuantity: 5, price: 20 }] }));
vi.mock("@mui/material/useMediaQuery", () => ({ default: () => state.compact }));
vi.mock("../../hooks/stores/useStoreBySlug.js", () => ({ default: () => ({ data: state.store }) }));
vi.mock("../../hooks/stores/useOwnerStorePreview.js", () => ({ default: () => ({ isOwnerPreview: false, previewSearch: "", buildStorePreviewPath: x => x }) }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ t: text => text, language: "A", dir: "rtl" }) }));
vi.mock("../../hooks/categories/useCategories.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/sections/useSections.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/products/useStorefrontCatalogProducts.js", () => ({ default: () => ({ data: state.products }) }));
vi.mock("../../hooks/cart/useAddToCart.js", () => ({ default: () => ({ mutateAsync: state.add }) }));
vi.mock("../../hooks/offers/useOffers.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
afterEach(cleanup);
beforeEach(() => { state.compact = true; state.add.mockReset().mockResolvedValue({}); });
const show = () => render(<MemoryRouter initialEntries={["/market/demo/products"]}><Routes><Route path="/market/:slug/products" element={<ProductsPage />} /></Routes></MemoryRouter>);

it("opens filters as a mobile dialog, filters results and preserves values after closing", async () => {
  show();
  expect(screen.queryByPlaceholderText("ابحث باسم المنتج أو الوصف")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "البحث والفلاتر" }));
  expect(screen.getByRole("dialog", { name: "البحث والفلاتر" })).toBeVisible();
  fireEvent.change(screen.getByPlaceholderText("ابحث باسم المنتج أو الوصف"), { target: { value: "Tea" } });
  fireEvent.click(screen.getByRole("button", { name: /عرض النتائج/ }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByText("Tea")).toBeVisible();
  expect(screen.queryByText("Coffee")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "البحث والفلاتر" }));
  expect(screen.getByPlaceholderText("ابحث باسم المنتج أو الوصف")).toHaveValue("Tea");
  fireEvent.click(screen.getByRole("button", { name: "إغلاق الفلاتر" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("keeps desktop filters visible and passes the selected quantity to the cart mutation", async () => {
  state.compact = false;
  const { container } = show();
  expect(screen.getByPlaceholderText("ابحث باسم المنتج أو الوصف")).toBeVisible();
  expect(screen.queryByRole("button", { name: "البحث والفلاتر" })).toBeNull();
  const card = within(container.querySelector(".product-card"));
  fireEvent.click(card.getByRole("button", { name: "زيادة الكمية" }));
  fireEvent.click(card.getByRole("button", { name: "زيادة الكمية" }));
  fireEvent.click(card.getByRole("button", { name: "أضف" }));
  await waitFor(() => expect(state.add).toHaveBeenCalledWith(expect.objectContaining({ productId: "p", quantity: 2, storeId: "s" })));
  await waitFor(() => expect(card.getByLabelText("الكمية", { selector: "output" })).toHaveTextContent("0"));
});

it("closes the mobile drawer with Escape and with a backdrop click", async () => {
  show();
  fireEvent.click(screen.getByRole("button", { name: "البحث والفلاتر" }));
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "البحث والفلاتر" }));
  fireEvent.click(document.querySelector(".MuiBackdrop-root"));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
