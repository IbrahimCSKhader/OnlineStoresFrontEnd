import axios from "axios";
import { beforeEach, expect, it, vi } from "vitest";
import { setupInterceptors } from "./interceptors.js";
import useAuthStore from "../store/authStore.js";

vi.mock("../store/authStore.js", () => ({ default: { getState: vi.fn() } }));
const storeId = "f5b05ab6-1be2-4e71-a8dc-da70ef9babfa";
beforeEach(() => {
  localStorage.clear();
  const session = { storeId, token: "customer-token", role: "StoreCustomer" };
  useAuthStore.getState.mockReturnValue({ storefrontSession: session, storefrontSessions: { [storeId]: session } });
});
it.each(["get", "put"])("sends the correct store customer token for profile %s", async method => {
  let request;
  const client = setupInterceptors(axios.create({ adapter: async config => { request = config; return { status: 200, data: {}, headers: {}, config }; } }));
  await client.request({ method, url: `/api/store-customer-auth/store/${storeId}/profile`, data: {} });
  expect(request.headers.Authorization).toBe("Bearer customer-token");
  expect(request.metadata.storefrontScope.storeId).toBe(storeId);
});
it("does not attach a customer token to anonymous guest checkout", async () => {
  let request;
  const client = setupInterceptors(axios.create({ adapter: async config => { request = config; return { status: 200, data: {}, headers: {}, config }; } }));
  await client.post("/api/Order/guest", { storeId });
  expect(request.headers.Authorization).toBeUndefined();
});
