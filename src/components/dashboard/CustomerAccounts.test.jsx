import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { CustomerAccount, CustomerDirectory } from "./CustomerAccounts.jsx";
import { customerAccountApi as api } from "../../API/customerAccount.api.js";

vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ t: text => text, currency: value => `${value} ₪`, dateTime: value => value }) }));
vi.mock("../../API/customerAccount.api.js", () => ({ customerAccountApi: { account: vi.fn(), list: vi.fn(), payment: vi.fn(), allocate: vi.fn(), reverse: vi.fn(), save: vi.fn(), backfill: vi.fn() } }));
const account = {
  customer: { id: "customer", firstName: "Ahmad", lastName: "Test", phone: "0591234567" },
  totalOrders: 550, totalPayments: 250, outstandingBalance: 300, credit: 0, unallocatedCredit: 0,
  orders: [{ id: "one", orderNumber: "ORD-101", charge: 200, paidAmount: 100, remainingAmount: 100, paymentStatus: "partial", credit: 0 },
    { id: "two", orderNumber: "ORD-125", charge: 350, paidAmount: 150, remainingAmount: 200, paymentStatus: "partial", credit: 0 }],
  statement: [{ id: "payment", kind: "Payment", amount: -250, balance: 300, date: "2026-10-01", allocations: [{ orderId: "one", orderNumber: "ORD-101", amount: 100 }, { orderId: "two", orderNumber: "ORD-125", amount: 150 }] }],
};
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function show(element = <CustomerAccount storeId="store" customerId="customer" />) {
  api.account.mockResolvedValue(account); api.list.mockResolvedValue({ items: [], total: 0 });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={client}>{element}</QueryClientProvider></MemoryRouter>);
}
it("shows overall and per-order balances with allocation history", async () => {
  show();
  expect(await screen.findByText("حساب العميل: Ahmad Test")).toBeInTheDocument();
  expect(screen.getByText("550 ₪")).toBeInTheDocument();
  expect(screen.getAllByText("دفعة جزئية")).toHaveLength(2);
  expect(screen.getByText("توزيع على الطلب: ORD-101 — 100 ₪")).toBeInTheDocument();
});
it("keeps the same request key after an uncertain failure and supports a multi-order payment", async () => {
  show(); await screen.findByText("حساب العميل: Ahmad Test");
  api.payment.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ id: "receipt" });
  fireEvent.click(screen.getByRole("button", { name: "تسجيل دفعة" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText(/المبلغ/), { target: { value: "100" } });
  fireEvent.change(within(dialog).getByLabelText("ORD-101 (100 ₪)"), { target: { value: "40" } });
  fireEvent.change(within(dialog).getByLabelText("ORD-125 (200 ₪)"), { target: { value: "60" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "حفظ" }));
  await waitFor(() => expect(api.payment).toHaveBeenCalledTimes(1));
  await within(dialog).findByRole("alert");
  fireEvent.click(within(dialog).getByRole("button", { name: "حفظ" }));
  await waitFor(() => expect(api.payment).toHaveBeenCalledTimes(2));
  const first = api.payment.mock.calls[0][2]; const retry = api.payment.mock.calls[1][2];
  expect(first.requestKey).toBe(retry.requestKey);
  expect(first.allocations).toEqual([{ orderId: "one", amount: 40 }, { orderId: "two", amount: 60 }]);
  expect(first.amount).toBe(100);
});
it("creates a manual customer profile without email or password", async () => {
  show(<CustomerDirectory storeId="store" />); api.save.mockResolvedValue({ id: "new" });
  fireEvent.click(screen.getByRole("button", { name: "إضافة عميل" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText(/الاسم الأول/), { target: { value: "Ahmad" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "حفظ العميل" }));
  await waitFor(() => expect(api.save).toHaveBeenCalledWith("store", undefined, expect.objectContaining({ firstName: "Ahmad" })));
  expect(api.save.mock.calls[0][2]).not.toHaveProperty("password");
  expect(api.save.mock.calls[0][2]).not.toHaveProperty("email");
});
