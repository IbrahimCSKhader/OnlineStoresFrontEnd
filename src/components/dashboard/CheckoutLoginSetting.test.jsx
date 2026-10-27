import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import CheckoutLoginSetting from "./CheckoutLoginSetting.jsx";
import storeApi from "../../API/store.api.js";

vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ t: text => text }) }));
vi.mock("../../API/store.api.js", () => ({ default: { updateStore: vi.fn() } }));
beforeEach(() => storeApi.updateStore.mockReset().mockResolvedValue({}));
it.each([true, false])("saves only this store's checkout requirement, starting with %s", async required => {
  render(<QueryClientProvider client={new QueryClient()}><CheckoutLoginSetting store={{ id: "store-a", requireCustomerLoginForCheckout: required }} /></QueryClientProvider>);
  const toggle = screen.getByRole("switch");
  expect(toggle.checked).toBe(required);
  expect(screen.getByRole("button", { name: "حفظ إعداد تسجيل الزبون" })).toBeDisabled();
  fireEvent.click(toggle);
  expect(storeApi.updateStore).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "حفظ إعداد تسجيل الزبون" }));
  await waitFor(() => expect(storeApi.updateStore).toHaveBeenCalledWith("store-a", { requireCustomerLoginForCheckout: !required }));
});
