import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { expect, it, vi } from "vitest";
import StoreDetails from "./StoreDetails.jsx";
import StoreAbout from "./StoreAbout.jsx";
import StoreContact from "./StoreContact.jsx";

vi.mock("../../API/store.api.js", () => ({ default: {
  getStoreBySlug: vi.fn(async () => ({ id: "shoman", slug: "shomanhome", name: "shomanhome", language: "I", description: "פריטים יפים לבית", businessType: "מוצרים לבית", storeStory: "יופי ונוחות לבית", isActive: true })),
  visitStore: vi.fn(async () => ({ visitCount: 1 })),
} }));
vi.mock("../../hooks/stores/useOwnerStorePreview.js", () => ({ default: () => ({ isOwnerPreview: false, previewSearch: "", buildStorePreviewPath: x => x }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../utils/customDomain.js", () => ({ getCurrentCustomDomainHost: () => null }));
vi.mock("../../hooks/cart/useAddToCart.js", () => ({ default: () => ({ mutate: vi.fn() }) }));
vi.mock("../../hooks/categories/useCategories.js", () => ({ default: () => ({ data: [], isLoading: false }) }));
vi.mock("../../hooks/products/useFeaturedProducts.js", () => ({ default: () => ({ data: [], isLoading: false }) }));
vi.mock("../../hooks/products/useStorefrontCatalogProducts.js", () => ({ default: () => ({ data: [], isLoading: false, pagination: {} }) }));

it.each([
  ["/market/shomanhome", StoreDetails, "כל המוצרים"],
  ["/market/shomanhome/about", StoreAbout, "הסיפור שלנו"],
  ["/market/shomanhome/contact", StoreContact, "אנחנו כאן בשבילכם"],
])("renders %s in Hebrew without any Arabic UI text", async (route, Component, heading) => {
  localStorage.clear();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { container } = render(
    <QueryClientProvider client={client}><MemoryRouter initialEntries={[route]}>
      <Routes><Route path="/market/:slug/*" element={<Component />} /></Routes>
    </MemoryRouter></QueryClientProvider>,
  );
  await screen.findByText(heading);
  await waitFor(() => expect(container.textContent).not.toMatch(/[\u0600-\u06ff]/));
  expect(container.textContent).toContain("shomanhome");
});
