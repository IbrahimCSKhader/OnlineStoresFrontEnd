import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard.jsx";
import OrderDetailsPage from "./OrderDetailsPage.jsx";
import CustomerDetailsPage from "./CustomerDetailsPage.jsx";
import axiosInstance from "../../API/axiosInstance.js";
const state = vi.hoisted(() => ({ store: {} }));
vi.mock("../../hooks/stores/useOwnerStore.js", () => ({ default: () => ({ ownerStore: state.store }) }));
vi.mock("../../hooks/auth/useAuth.js", () => ({ default: () => ({ isAuthenticated: true, role: "StoreOwner", user: { id: "owner" } }) }));
vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ t: value => value, currency: String, dateTime: String }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../API/axiosInstance.js", () => ({ default: { get: vi.fn(async () => []), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function show(Component, isCatalog, initialTab = "overview", id = "s") {
  state.store = { id, slug: "demo", name: "Demo", isCatalog };
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={["/owner/test"]}><Routes>
      <Route path="/owner/test" element={<Component initialTab={initialTab} />} />
      <Route path="/owner" element={<p>Owner home</p>} />
    </Routes></MemoryRouter>
  </QueryClientProvider>);
}
it.each(["overview", "coupons"])("Animal Kingdom hides coupons on %s while keeping orders available", async tab => {
  show(Dashboard, false, tab, "A601BE8D-8D2D-4A79-B0E2-272490194669");
  expect(screen.queryByRole("button", { name: /بناء العروض السريعة/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /متابعة الحالة والتجهيز/ })).toBeInTheDocument();
  expect(screen.getByText("المنتجات المنشورة")).toBeInTheDocument();
  await waitFor(() => expect(axiosInstance.get).toHaveBeenCalled());
  expect(axiosInstance.get.mock.calls.some(([url]) => /\/Coupon(?:\/|$)/i.test(url))).toBe(false);
});
it.each([false, true])("owner options respect catalog=%s", async isCatalog => {
  show(Dashboard, isCatalog);
  expect(screen.getByRole("button", { name: /إضافة وتعديل ونشر المنتجات/ })).toBeInTheDocument();
  for (const description of [/متابعة الحالة والتجهيز/, /بناء العروض السريعة/, /تحديد من يشاهد سعر الجملة/])
    expect(Boolean(screen.queryByRole("button", { name: description }))).toBe(!isCatalog);
  expect(Boolean(screen.queryByText("خيارات التوصيل"))).toBe(!isCatalog);
  expect(Boolean(screen.queryByText("الطلبات المفتوحة"))).toBe(!isCatalog);
  await waitFor(() => expect(axiosInstance.get).toHaveBeenCalled());
  if (isCatalog) expect(axiosInstance.get.mock.calls.some(([url]) => /\/(Order|Coupon|CustomerStore)(?:\/|$)/i.test(url))).toBe(false);
});
it.each(["orders", "coupons", "customers"])("catalog cannot open the %s dashboard tab", tab => {
  show(Dashboard, true, tab);
  expect(screen.getByText("المنتجات المنشورة")).toBeInTheDocument();
  expect(screen.queryByText("خيارات التوصيل")).not.toBeInTheDocument();
});
it.each([OrderDetailsPage, CustomerDetailsPage])("catalog redirects owner commerce detail pages", Component => {
  show(Component, true);
  expect(screen.getByText("Owner home")).toBeInTheDocument();
});
