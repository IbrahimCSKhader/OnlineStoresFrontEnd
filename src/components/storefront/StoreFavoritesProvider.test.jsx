import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import favoritesApi from "../../API/storeFavorites.api.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import ProductFavoriteButton from "./ProductFavoriteButton.jsx";
import StoreFavoritesProvider from "./StoreFavoritesProvider.jsx";

vi.mock("../../API/storeFavorites.api.js", () => ({
  default: { get: vi.fn(), merge: vi.fn(), add: vi.fn(), remove: vi.fn() },
}));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: vi.fn() }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({
  default: () => ({ t: (label, name) => label.replace("{0}", name) }),
}));

function signIn(customerId) {
  vi.mocked(useStorefrontSession).mockReturnValue({
    hasScopedStorefrontSession: true,
    storefrontSession: { token: `token-${customerId}` },
    storefrontCustomer: { storeCustomerId: customerId },
  });
}

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = storeId => (
    <QueryClientProvider client={client}>
      <StoreFavoritesProvider storeId={storeId}>
        <ProductFavoriteButton product={{ id: "local-product", name: "Local", storeId }} />
        <ProductFavoriteButton product={{ id: "server-product", name: "Server", storeId }} />
      </StoreFavoritesProvider>
    </QueryClientProvider>
  );
  const { rerender } = render(view("first"));
  return (storeId = "first") => rerender(view(storeId));
}

const addLocal = () => screen.getByRole("button", { name: "إضافة Local إلى المفضلة" });
const removeLocal = () => screen.getByRole("button", { name: "إزالة Local من المفضلة" });

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  vi.mocked(useStorefrontSession).mockReturnValue({ hasScopedStorefrontSession: false });
});
afterEach(cleanup);

it("persists guest hearts per store and merges them into the signed-in account", async () => {
  const switchStore = show();
  fireEvent.click(addLocal());
  await waitFor(() => expect(removeLocal()).toHaveAttribute("aria-pressed", "true"));
  expect(favoritesApi.add).not.toHaveBeenCalled();

  switchStore("second");
  expect(addLocal()).toHaveAttribute("aria-pressed", "false");
  switchStore();
  expect(removeLocal()).toBeEnabled();

  favoritesApi.merge.mockResolvedValue(["local-product", "server-product"]);
  favoritesApi.remove.mockResolvedValue(undefined);
  signIn("alice");
  switchStore();
  await waitFor(() => expect(removeLocal()).toBeEnabled());
  expect(favoritesApi.merge).toHaveBeenCalledExactlyOnceWith("first", ["local-product"], "token-alice", expect.any(AbortSignal));
  expect(screen.getByRole("button", { name: "إزالة Server من المفضلة" })).toBeEnabled();
  expect(localStorage.getItem("store-favorites:first")).toBeNull();
  fireEvent.click(removeLocal());
  await waitFor(() => expect(addLocal()).toBeEnabled());
  expect(favoritesApi.remove).toHaveBeenCalledExactlyOnceWith("first", "local-product", "token-alice");
});

it("preserves a failed import for the same account without transferring it to a different login", async () => {
  const switchStore = show();
  fireEvent.click(addLocal());
  await waitFor(() => expect(removeLocal()).toBeEnabled());
  favoritesApi.merge.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(["local-product"]);
  favoritesApi.get.mockResolvedValue([]);
  signIn("alice");
  switchStore();
  await waitFor(() => expect(favoritesApi.merge).toHaveBeenCalledTimes(1));
  expect(localStorage.getItem("store-favorites:first")).toContain("local-product");

  signIn("bob");
  switchStore();
  await waitFor(() => expect(addLocal()).toBeEnabled());
  expect(favoritesApi.get).toHaveBeenCalledWith("first", "token-bob", expect.any(AbortSignal));
  expect(favoritesApi.merge).toHaveBeenCalledTimes(1);

  signIn("alice");
  switchStore();
  await waitFor(() => expect(removeLocal()).toBeEnabled());
  expect(favoritesApi.merge).toHaveBeenCalledTimes(2);
  expect(localStorage.getItem("store-favorites:first")).toBeNull();
});
