import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, it, expect } from "vitest";
import StoreOffers from "./StoreOffers.jsx";
import BundleManager from "./BundleManager.jsx";
import { offerApi } from "../../API/offer.api.js";
import { getGuestCart } from "../../utils/guestCart.js";
const { state } = vi.hoisted(() => ({ state: { guest: true } }));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: () => ({ useLocalGuestCart: state.guest }) }));
vi.mock("../../API/offer.api.js", () => ({ offerApi: { active: vi.fn(), managed: vi.fn(), addBundle: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() } }));
const offer = { id: "offer", name: "عرض العناية", type: 1, bundlePrice: 45, regularPrice: 60, savings: 15, availableBundles: 5,
  items: [{ id: "i1", productId: "p1", productName: "شامبو", requiredQuantity: 2, productImageUrl: "/shampoo.png" },
    { id: "i2", productId: "p2", productName: "صابون", requiredQuantity: 1, productImageUrl: "/soap.png" }] };
function show(element) { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{element}</MemoryRouter></QueryClientProvider>); }
it.each([false, true])("limits the homepage to four bundles and shows all bundles on the offers page (showAll=%s)", async showAll => {
  offerApi.active.mockResolvedValue(Array.from({ length: 7 }, (_, i) => ({ ...offer, id: `offer-${i}`, name: `Bundle ${i}` })));
  show(<StoreOffers store={{ id: `store-${showAll}`, slug: "store" }} showAll={showAll} />);
  await screen.findByText("Bundle 0");
  expect(screen.getAllByRole("article")).toHaveLength(showAll ? 7 : 4);
  expect(Boolean(screen.queryByText("Bundle 4"))).toBe(showAll);
  if (!showAll) {
    const link = screen.getByRole("link", { name: "عرض كل العروض" });
    expect(link).toHaveAttribute("href", "/market/store/offers");
    expect(link.closest(".store-offers__footer")).not.toBeNull();
  } else expect(screen.queryByRole("link", { name: "عرض كل العروض" })).toBeNull();
});
it("shows every component image, the discount badge and adds one indivisible guest bundle", async () => {
  localStorage.clear(); state.guest = true; offerApi.active.mockResolvedValue([offer]);
  show(<StoreOffers store={{ id: "store", slug: "store" }} />);
  expect(await screen.findByText("عرض العناية")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "شامبو" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "صابون" })).toBeInTheDocument();
  expect(screen.getByText("وفر 25%")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "أضف الباكيج للسلة" }));
  await screen.findByText("تمت إضافة الباكيج للسلة");
  expect(getGuestCart("store").items).toHaveLength(1);
  expect(getGuestCart("store").totalAmount).toBe(45);
  expect(getGuestCart("store").items[0].bundleOfferId).toBe("offer");
});
it("uses the atomic bundle API for registered customers", async () => {
  state.guest = false; offerApi.active.mockResolvedValue([offer]); offerApi.addBundle.mockResolvedValue({ items: [] });
  show(<StoreOffers store={{ id: "store2" }} />);
  fireEvent.click(await screen.findByRole("button", { name: "أضف الباكيج للسلة" }));
  await waitFor(() => expect(offerApi.addBundle).toHaveBeenCalledWith({ storeId: "store2", offerId: "offer", quantity: 1 }));
});
it("catalog offers display contents without a purchase button", async () => {
  offerApi.active.mockResolvedValue([offer]); show(<StoreOffers store={{ id: "catalog", isCatalog: true }} />);
  await screen.findByText("عرض العناية"); expect(screen.queryByRole("button", { name: "أضف الباكيج للسلة" })).toBeNull();
});
it("saves chosen product quantities and one total price through the owner editor", async () => {
  offerApi.managed.mockResolvedValue([]); offerApi.create.mockResolvedValue(offer);
  show(<BundleManager storeId="owner-store" products={[{ id: "p1", name: "شامبو", price: 30 }]} />);
  fireEvent.change(screen.getByLabelText(/اسم الباكيج/), { target: { value: "باكيج جديد" } });
  fireEvent.change(screen.getByLabelText(/سعر الباكيج كامل/), { target: { value: "22.50" } });
  fireEvent.click(screen.getByLabelText("شامبو"));
  fireEvent.change(screen.getByLabelText("كمية شامبو"), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "حفظ الباكيج" }));
  await waitFor(() => expect(offerApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "باكيج جديد", bundlePrice: 22.5, type: 1,
    items: [{ productId: "p1", requiredQuantity: 3 }] })));
});

it("previews only four components while preserving the entire package for purchase", async () => {
  localStorage.clear(); state.guest = true;
  const large = { ...offer, items: Array.from({ length: 6 }, (_, i) => ({ id: `item-${i}`, productId: `product-${i}`, productName: `Product ${i}`, productImageUrl: `/p-${i}.png`, requiredQuantity: 1 })) };
  offerApi.active.mockResolvedValue([large]);
  show(<StoreOffers store={{ id: "large-store", slug: "large" }} />);
  expect(await screen.findByRole("img", { name: "Product 0" })).toBeInTheDocument();
  expect(screen.getAllByRole("img")).toHaveLength(4);
  expect(screen.queryByText("Product 4")).toBeNull();
  expect(screen.getByText("ومنتجات إضافية: 2")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "عرض تفاصيل الباكيج" })).toHaveAttribute("href", "/market/large/offers/offer");
  fireEvent.click(screen.getByRole("button", { name: "أضف الباكيج للسلة" }));
  await screen.findByText("تمت إضافة الباكيج للسلة");
  expect(getGuestCart("large-store").items[0].bundleComponents).toHaveLength(6);
});
