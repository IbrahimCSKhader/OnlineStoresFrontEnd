import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import DeliveryLocationsForm from "./DeliveryLocationsForm.jsx";
import storeApi from "../../API/store.api.js";
vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ t: (text) => text }) }));
vi.mock("../../API/store.api.js", () => ({ default: { updateStore: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("saves server identifiers and reuses them on the next edit, then supports removing all locations", async () => {
  storeApi.updateStore.mockResolvedValue({ data: { deliveryLocations: [{ id: "saved", name: "Hebron", cost: 10 }] } });
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><DeliveryLocationsForm store={{ id: "store", deliveryLocations: [] }} /></QueryClientProvider>);
  fireEvent.click(screen.getByRole("button", { name: "إضافة مكان توصيل" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hebron" } });
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "10" } });
  fireEvent.submit(screen.getByRole("button", { name: "حفظ خيارات التوصيل" }).closest("form"));
  await screen.findByText("تم حفظ خيارات التوصيل");
  expect(storeApi.updateStore).toHaveBeenLastCalledWith("store", { deliveryLocations: [{ name: "Hebron", cost: 10 }] });
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });
  fireEvent.submit(screen.getByRole("button", { name: "حفظ خيارات التوصيل" }).closest("form"));
  await waitFor(() => expect(storeApi.updateStore).toHaveBeenLastCalledWith("store", {
    deliveryLocations: [{ id: "saved", name: "Hebron", cost: 12 }],
  }));
  await screen.findByText("تم حفظ خيارات التوصيل");
  fireEvent.click(screen.getByRole("button", { name: "حذف" }));
  fireEvent.submit(screen.getByRole("button", { name: "حفظ خيارات التوصيل" }).closest("form"));
  await waitFor(() => expect(storeApi.updateStore).toHaveBeenLastCalledWith("store", { deliveryLocations: [] }));
});
