import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import Dashboard from "./Dashboard.jsx";

vi.mock("../../hooks/stores/useOwnerStore.js", () => ({ default: () => ({ ownerStore: { id: "s", name: "Shop", slug: "shop" } }) }));
vi.mock("../../hooks/auth/useAuth.js", () => ({ default: () => ({ isAuthenticated: true, role: "StoreOwner", user: { id: "owner" } }) }));
vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ t: value => value, currency: String, dateTime: String, locale: "en" }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../API/axiosInstance.js", () => ({ default: { get: vi.fn(async url => /\/Order\/store\/s$/.test(url) ? [
  { id: "1", orderNumber: "ORD-1", customerName: "Alice", storeCustomerId: "a", createdAt: "2026-10-25T23:59:59", items: [] },
  { id: "2", orderNumber: "ORD-2", customerName: "Bob", storeCustomerId: "b", createdAt: "2026-10-24T12:00:00", items: [] },
] : []), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

it("shows print actions on order cards and combines customer/date filters with reset", async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><Dashboard initialTab="orders" /></MemoryRouter></QueryClientProvider>);
  await screen.findByRole("link", { name: "ORD-1" });
  expect(screen.getAllByRole("link", { name: "طباعة الفاتورة" })).toHaveLength(2);
  expect(screen.getAllByRole("link", { name: "طباعة الفاتورة" })[0]).toHaveAttribute("href", "/owner/orders/1?print=1");
  fireEvent.change(screen.getByLabelText("البحث حسب العميل"), { target: { value: "Alice" } });
  expect(screen.queryByRole("link", { name: "ORD-2" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("إلى تاريخ"), { target: { value: "2026-10-24" } });
  expect(screen.getByText("لا توجد طلبات مطابقة")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "مسح فلاتر الطلبات" }));
  await waitFor(() => expect(screen.getAllByRole("link", { name: "طباعة الفاتورة" })).toHaveLength(2));
  fireEvent.change(screen.getByLabelText("من تاريخ"), { target: { value: "2026-10-25" } });
  fireEvent.change(screen.getByLabelText("إلى تاريخ"), { target: { value: "2026-10-25" } });
  expect(screen.getByRole("link", { name: "ORD-1" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "ORD-2" })).not.toBeInTheDocument();
});
