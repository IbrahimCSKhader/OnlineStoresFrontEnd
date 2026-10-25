import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import OrderReceivedAmount from "./OrderReceivedAmount.jsx";
import orderApi from "../../API/order.api.js";

vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ t: text => text, currency: amount => `${amount} ₪` }) }));
vi.mock("../../API/order.api.js", () => ({ default: { updateReceivedAmount: vi.fn(async () => ({})) } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function show(receivedAmount) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(<QueryClientProvider client={client}><OrderReceivedAmount storeId="store" order={{ id: "order", totalAmount: 115.5, receivedAmount }} /></QueryClientProvider>);
  return invalidate;
}
it.each([[null, null], [0, "المتبقي: 115.5 ₪"], [50.25, "المتبقي: 65.25 ₪"], [115.5, "تم الاستلام بالكامل"], [130.75, "زيادة مستلمة: 15.25 ₪"]])("shows the saved difference for %s", (received, label) => {
  show(received);
  if (label) expect(screen.getByText(label)).toBeInTheDocument();
  else expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("saves the cumulative received amount and refreshes the list and detail", async () => {
  const invalidate = show(null);
  fireEvent.change(screen.getByLabelText("مبلغ الاستلام"), { target: { value: "80.25" } });
  fireEvent.click(screen.getByRole("button", { name: "حفظ مبلغ الاستلام" }));
  await waitFor(() => expect(orderApi.updateReceivedAmount).toHaveBeenCalledWith("order", { receivedAmount: 80.25 }));
  await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
});
it("clears the receipt without converting an empty field to zero", async () => {
  show(50);
  fireEvent.change(screen.getByLabelText("مبلغ الاستلام"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "حفظ مبلغ الاستلام" }));
  await waitFor(() => expect(orderApi.updateReceivedAmount).toHaveBeenCalledWith("order", { receivedAmount: null }));
});
it.each(["-1", "10.001"])("rejects invalid received amount %s", value => {
  show(null);
  fireEvent.change(screen.getByLabelText("مبلغ الاستلام"), { target: { value } });
  fireEvent.submit(screen.getByRole("button", { name: "حفظ مبلغ الاستلام" }).closest("form"));
  expect(orderApi.updateReceivedAmount).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("أدخل مبلغاً موجباً أو صفراً");
});
