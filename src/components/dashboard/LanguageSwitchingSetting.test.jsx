import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import LanguageSwitchingSetting from "./LanguageSwitchingSetting.jsx";
import storeApi from "../../API/store.api.js";

vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ t: text => text }) }));
vi.mock("../../API/store.api.js", () => ({ default: { updateStore: vi.fn() } }));
beforeEach(() => storeApi.updateStore.mockReset().mockResolvedValue({}));
it.each([true, false, undefined])("saves this store's language setting, starting with %s", async enabled => {
  render(<QueryClientProvider client={new QueryClient()}><LanguageSwitchingSetting store={{ id: "store-a", enableLanguageSwitching: enabled }} /></QueryClientProvider>);
  const toggle = screen.getByRole("switch");
  expect(toggle.checked).toBe(enabled === true);
  fireEvent.click(toggle);
  fireEvent.click(screen.getByRole("button", { name: "حفظ إعداد اللغة" }));
  await waitFor(() => expect(storeApi.updateStore).toHaveBeenCalledWith("store-a", { enableLanguageSwitching: enabled !== true }));
});
