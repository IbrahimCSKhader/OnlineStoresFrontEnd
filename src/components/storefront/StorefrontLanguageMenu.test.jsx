import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import storeApi from "../../API/store.api.js";
import StorefrontLanguageMenu from "./StorefrontLanguageMenu.jsx";

vi.mock("../../API/store.api.js", () => ({ default: { getStoreBySlug: vi.fn() } }));
vi.mock("../../utils/customDomain.js", () => ({ getCurrentCustomDomainHost: () => null }));
beforeEach(() => vi.clearAllMocks());
it.each([false, undefined, true])("shows the menu only when explicitly enabled: %s", async enabled => {
  storeApi.getStoreBySlug.mockResolvedValue({ language: "I", enableLanguageSwitching: enabled });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={["/market/demo"]}><StorefrontLanguageMenu /></MemoryRouter>
  </QueryClientProvider>);
  await waitFor(() => expect(storeApi.getStoreBySlug).toHaveBeenCalled());
  if (enabled) {
    fireEvent.click(await screen.findByRole("button", { name: "שפה" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "English" }));
    await screen.findByRole("button", { name: "Language" });
  } else {
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  }
});
