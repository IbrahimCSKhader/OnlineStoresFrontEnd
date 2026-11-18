import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import PremiumOffer from "./PremiumOffer.jsx";
const { state, add } = vi.hoisted(() => ({ state: { offers: [] }, add: vi.fn() }));
vi.mock("../../hooks/offers/useOffers.js", () => ({ default: () => ({ data: state.offers }) }));
vi.mock("../../hooks/offers/useAddBundle.js", () => ({ default: () => ({ mutate: add }) }));
vi.mock("../../hooks/stores/useOwnerStorePreview.js", () => ({ default: () => ({ buildStorePreviewPath: x => x }) }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ locale: "en", t: (text, ...args) => text.replace(/\{(\d+)\}/g, (_, i) => args[i]) }) }));
const offer = { id: "premium", type: 1, priority: 1000, name: "عرض القهوة", isActive: true,
  startDate: "2026-11-17T00:00:00", endDate: "2026-11-18T00:00:20", bundlePrice: 20, regularPrice: 24,
  availableBundles: 30, items: [{ productId: "coffee", productName: "قهوة", productImageUrl: "/coffee.png", requiredQuantity: 1 }] };
function show() { return render(<MemoryRouter><PremiumOffer store={{ id: "s", slug: "shop" }} /></MemoryRouter>); }
afterEach(() => { vi.useRealTimers(); add.mockClear(); });

it("uses the saved offer for purchase and automatically disappears at its UTC expiry", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-18T00:00:00Z"));
  state.offers = [offer];
  show();
  expect(screen.getByRole("heading", { name: "عرض القهوة" })).toBeInTheDocument();
  expect(screen.getByRole("timer")).toHaveTextContent("20");
  expect(screen.getByRole("link", { name: "تفاصيل العرض" })).toHaveAttribute("href", "/market/shop/offers/premium");
  fireEvent.click(screen.getByRole("button", { name: "احصل على العرض" }));
  expect(add).toHaveBeenCalledWith(offer);
  act(() => vi.advanceTimersByTime(20000));
  expect(screen.queryByRole("heading", { name: "عرض القهوة" })).toBeNull();
});

it("keeps regular, expired, future and sold-out offers out of the premium section", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-18T00:00:00Z"));
  state.offers = [{ ...offer, priority: 0 }, { ...offer, endDate: "2026-11-17T00:00:00Z" },
    { ...offer, startDate: "2026-11-19T00:00:00Z" }, { ...offer, availableBundles: 0 }];
  const { container } = show();
  expect(container).toBeEmptyDOMElement();
});
