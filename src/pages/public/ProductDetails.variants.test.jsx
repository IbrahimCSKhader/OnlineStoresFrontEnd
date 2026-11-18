import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import ProductDetails from "./ProductDetails.jsx";

const { add, state } = vi.hoisted(() => ({ add: vi.fn(), state: { legacy: false, signedIn: false } }));
const variant = (id, color, size, price, stockQuantity) => ({
  id, name: `${color} ${size}`, sku: id.toUpperCase(), price, stockQuantity,
  imageUrl: `/${id}.png`, isActive: true,
  attributeValues: state.legacy ? [] : [
    { attributeId: "color", attributeName: "اللون", value: color },
    { attributeId: "size", attributeName: "المقاس", value: size },
  ],
});
vi.mock("../../hooks/stores/useStoreBySlug.js", () => ({ default: () => ({ data: { id: "s", slug: "demo", name: "Demo" } }) }));
vi.mock("../../hooks/products/useProductDetails.js", () => ({ default: () => ({ data: {
  id: "p", storeId: "s", name: "Shirt", price: 20, status: 1, trackInventory: true,
  hasVariants: true, defaultVariantId: "red-s", images: [{ id: "base", url: "/base.png" }],
  variants: [variant("red-s", "أحمر", "S", 25, 0), variant("red-m", "أحمر", "M", 26, 3),
    variant("blue-s", "أزرق", "S", 30, 5), variant("blue-m", "أزرق", "M", 35, 2),
    variant("green-l", "أخضر", "L", 40, 0)],
} }) }));
vi.mock("../../hooks/products/useProductsByCategory.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/products/useProductsBySection.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/cart/useAddToCart.js", () => ({ default: () => ({ mutate: add }) }));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: () => ({ hasScopedStorefrontSession: state.signedIn }) }));
vi.mock("../../hooks/stores/useOwnerStorePreview.js", () => ({ default: () => ({ isOwnerPreview: false, buildStorePreviewPath: x => x }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../API/product.api.js", () => ({ default: { visitProduct: async () => ({}) } }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({
  language: "A", t: (text, ...args) => text.replace(/\{(\d+)\}/g, (_, index) => args[index]),
}) }));

function show() {
  return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={["/market/demo/product/p"]}>
    <Routes><Route path="/market/:slug/product/:productId" element={<ProductDetails />} /></Routes>
  </MemoryRouter></QueryClientProvider>);
}
afterEach(() => { add.mockClear(); state.legacy = false; });

it.each([false, true])("updates variant details and submits its exact ID to the existing cart flow (signedIn=%s)", signedIn => {
  state.signedIn = signedIn;
  const { container } = show();
  expect(screen.getByText("SKU: RED-M")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "المقاس S · غير متوفر" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "اللون أخضر · غير متوفر" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "اللون أزرق" }));
  expect(screen.getByText("SKU: BLUE-M")).toBeInTheDocument();
  expect(container.querySelector(".page-product-details__price")).toHaveTextContent("35");
  fireEvent.click(screen.getByRole("button", { name: "المقاس S" }));
  expect(screen.getByText("SKU: BLUE-S")).toBeInTheDocument();
  expect(container.querySelector(".page-product-details__price")).toHaveTextContent("30");
  expect(container.querySelector(".product-gallery__image").src).toContain("/blue-s.png");
  expect(screen.getByText("المتوفر: 5")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "زيادة الكمية" }));
  const addButton = screen.getByRole("button", { name: "أضف إلى السلة" });
  fireEvent.click(addButton);
  expect(add).toHaveBeenCalledWith(expect.objectContaining({ productId: "p", storeId: "s", variantId: "blue-s", quantity: 2 }));
  fireEvent.click(screen.getByRole("button", { name: "عرض صور المنتج" }));
  expect(container.querySelector(".product-gallery__image").src).toContain("/base.png");
  expect(addButton).toBeDisabled();
});

it("keeps legacy variants selectable when they have no attribute matrix", () => {
  state.legacy = true;
  show();
  const blue = screen.getByRole("button", { name: /أزرق S/ });
  fireEvent.click(blue);
  expect(screen.getByText("SKU: BLUE-S")).toBeInTheDocument();
  expect(blue).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: /أخضر L/ })).toBeDisabled();
});
