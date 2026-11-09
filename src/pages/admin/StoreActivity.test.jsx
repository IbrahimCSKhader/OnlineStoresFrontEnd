import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { customerAccountApi } from "../../API/customerAccount.api.js";
import useStoreOrders from "../../hooks/orders/useStoreOrders.js";
import useSuperAdminStoreWorkspace from "../../hooks/superAdmin/useSuperAdminStoreWorkspace.js";
import StoreActivity from "./StoreActivity.jsx";

vi.mock("../../API/customerAccount.api.js", () => ({ customerAccountApi: { list: vi.fn() } }));
vi.mock("../../hooks/orders/useStoreOrders.js", () => ({ default: vi.fn() }));
vi.mock("../../hooks/superAdmin/useSuperAdminStoreWorkspace.js", () => ({ default: vi.fn() }));

const store = { id: "store-a", visitCount: 34 };

function openActivity(isCatalog = false) {
  useSuperAdminStoreWorkspace.mockReturnValue({ data: { ...store, isCatalog } });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter><StoreActivity store={store} /></MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  customerAccountApi.list.mockReset().mockResolvedValue({
    total: 2,
    items: [{ id: "guest-a", firstName: "زبون", lastName: "زائر", isGuestProfile: true }],
  });
  useStoreOrders.mockReturnValue({
    isSuccess: true,
    data: [
      { id: "order-a", orderNumber: "A-101", status: 0, totalAmount: 30, receivedAmount: 10, remainingAmount: 20, paymentStatus: "partial" },
      { id: "order-b", orderNumber: "A-100", status: 4, totalAmount: 50, receivedAmount: null, remainingAmount: null, paymentStatus: "unpaid" },
    ],
  });
});

it("links the selected store's latest orders and customer files and filters recorded balances", async () => {
  openActivity();
  expect(await screen.findByRole("link", { name: "زبون زائر" })).toHaveAttribute("href", "/dashboard/stores/store-a/manage/customers/guest-a");
  expect(customerAccountApi.list).toHaveBeenCalledWith("store-a");
  expect(screen.getByRole("link", { name: "A-101" })).toHaveAttribute("href", "/dashboard/stores/store-a/manage/orders/order-a");
  expect(screen.getByText("الاستلام غير مسجّل")).toBeVisible();

  fireEvent.mouseDown(screen.getByRole("combobox", { name: "عرض الطلبات" }));
  fireEvent.click(await screen.findByRole("option", { name: "باقي مبلغ مسجّل" }));
  expect(screen.getByRole("link", { name: "A-101" })).toBeVisible();
  expect(screen.queryByRole("link", { name: "A-100" })).not.toBeInTheDocument();
});

it("keeps catalog stores from requesting or exposing order links", async () => {
  openActivity(true);
  expect(await screen.findByText("زبون زائر")).toBeVisible();
  expect(useStoreOrders).toHaveBeenCalledWith("store-a", expect.objectContaining({ enabled: false }));
  expect(screen.queryByRole("link", { name: "A-101" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "الطلبات" })).not.toBeInTheDocument();
});
