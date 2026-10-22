import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { it, expect, vi } from "vitest";
import OfferDetails from "./OfferDetails.jsx";
import { offerApi } from "../../API/offer.api.js";
import { getGuestCart } from "../../utils/guestCart.js";
const { state } = vi.hoisted(() => ({ state: { catalog: false, preview: false } }));
vi.mock("../../hooks/stores/useStoreBySlug.js", () => ({ default: () => ({ data: { id: "s", slug: "store", name: "Store", isCatalog: state.catalog } }) }));
vi.mock("../../hooks/stores/useOwnerStorePreview.js", () => ({ default: () => ({ isOwnerPreview: state.preview, buildStorePreviewPath: path => state.preview ? `${path}?preview=owner` : path }) }));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: () => ({ useLocalGuestCart: true }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../API/offer.api.js", () => ({ offerApi: { active: vi.fn() } }));
const offer = { id: "o", name: "Full package", type: 1, bundlePrice: 45, regularPrice: 60, availableBundles: 8,
  items: Array.from({ length: 7 }, (_, i) => ({ id: `i${i}`, productId: `p${i}`, productName: `Product ${i}`, productImageUrl: `/image${i}.png`, requiredQuantity: i + 1 })) };
function show() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={["/market/store/offers/o"]}><Routes><Route path="/market/:slug/offers/:offerId" element={<OfferDetails />} /></Routes></MemoryRouter>
  </QueryClientProvider>);
}
it("opens the full package, lists every component and purchases all seven products", async () => {
  localStorage.clear(); state.catalog = false; state.preview = false; offerApi.active.mockResolvedValue([offer]);
  show(); await screen.findByRole("heading", { name: "Full package" });
  expect(screen.getAllByRole("img")).toHaveLength(7);
  expect(screen.getByText("الكمية ضمن الباكيج: 7")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Product 6" })).toHaveAttribute("href", "/market/store/product/p6");
  fireEvent.click(screen.getByRole("button", { name: "أضف الباكيج للسلة" }));
  await screen.findByText("تمت إضافة الباكيج للسلة");
  expect(getGuestCart("s").items[0].bundleComponents).toHaveLength(7);
});
it("shows an unavailable state for a missing, expired or foreign-store offer", async () => {
  offerApi.active.mockResolvedValue([]); show(); await screen.findByText("العرض غير متاح حالياً");
  expect(screen.queryByRole("button", { name: "أضف الباكيج للسلة" })).toBeNull();
});
it("preserves owner preview links and disables package purchases", async () => {
  state.preview = true; offerApi.active.mockResolvedValue([offer]); show();
  expect(await screen.findByRole("button", { name: "أضف الباكيج للسلة" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Product 0" })).toHaveAttribute("href", "/market/store/product/p0?preview=owner");
});
it("catalog package details retain all products without purchase controls", async () => {
  state.catalog = true; state.preview = false; offerApi.active.mockResolvedValue([offer]); show();
  await screen.findByRole("heading", { name: "Full package" });
  expect(screen.getAllByRole("img")).toHaveLength(7);
  expect(screen.queryByRole("button", { name: "أضف الباكيج للسلة" })).toBeNull();
});
