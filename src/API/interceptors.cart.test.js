import axios from "axios";
import { beforeEach, expect, it, vi } from "vitest";
import { setupInterceptors } from "./interceptors.js";
import useAuthStore from "../store/authStore.js";

vi.mock("../store/authStore.js", () => ({ default: { getState: vi.fn() } }));

const storeId = "f5b05ab6-1be2-4e71-a8dc-da70ef9babfa";
const otherStoreId = "9787a4d3-d0e0-48a9-9cb9-e6fb8f2838ba";
const session = { storeId, token: "registered-customer-token", role: "StoreCustomer" };
let captured;
let client;

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  useAuthStore.getState.mockReturnValue({ storefrontSession: session, storefrontSessions: { [storeId]: session } });
  client = setupInterceptors(axios.create({ adapter: async config => {
    captured = config;
    return { data: { success: true }, status: 200, statusText: "OK", headers: {}, config };
  } }));
});

it.each(["/", "/market/ma3rad-alakhawen"]) ("sends the registered customer's token when adding from %s", async path => {
  window.history.replaceState({}, "", path);
  await client.post("/api/Cart/add", { storeId, productId: "product", quantity: 1 });
  expect(captured.metadata.storefrontScope.storeId).toBe(storeId);
  expect(captured.headers.Authorization).toBe("Bearer registered-customer-token");
});

it("selects the payload store's session when another store is active", async () => {
  useAuthStore.getState.mockReturnValue({
    storefrontSession: { storeId: otherStoreId, token: "other-token" },
    storefrontSessions: { [storeId]: session, [otherStoreId]: { storeId: otherStoreId, token: "other-token" } },
  });
  await client.post("/api/Cart/add", JSON.stringify({ StoreId: storeId, quantity: 1 }));
  expect(captured.headers.Authorization).toBe("Bearer registered-customer-token");
});

it.each([`/api/Cart/${storeId}`, `/api/Cart/clear/${storeId}`])("preserves the route's store scope for %s", async url => {
  await client.request({ url, method: url.includes("clear") ? "delete" : "get" });
  expect(captured.metadata.storefrontScope.storeId).toBe(storeId);
  expect(captured.headers.Authorization).toBe("Bearer registered-customer-token");
});

it("does not attach another store's token to an add request", async () => {
  await client.post("/api/Cart/add", { storeId: otherStoreId, quantity: 1 });
  expect(captured.headers.Authorization).toBeUndefined();
});

it("does not invent a session for a guest", async () => {
  useAuthStore.getState.mockReturnValue({ storefrontSession: null, storefrontSessions: {} });
  await client.post("/api/Cart/add", { storeId, quantity: 1 });
  expect(captured.headers.Authorization).toBeUndefined();
});
