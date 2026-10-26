import axios from "axios";
import { beforeEach, expect, it, vi } from "vitest";
import { setupInterceptors } from "./interceptors.js";
import { storageKeys } from "../utils/storage.js";
import useAuthStore from "../store/authStore.js";

vi.mock("../store/authStore.js", () => ({ default: { getState: vi.fn() } }));
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(storageKeys.platformAuthToken, "admin-token");
  useAuthStore.getState.mockReturnValue({ storefrontSession: { token: "customer-token", storeId: "a" }, storefrontSessions: {} });
});

it.each([
  ["get", "/api/Store/a/appearance"],
  ["put", "/api/Store/a/appearance"],
  ["delete", "/api/Store/a/appearance"],
  ["delete", "/api/Store/a/appearance/light"],
  ["delete", "/api/Store/a/appearance/dark/primary"],
])("uses platform authentication for %s %s", async (method, url) => {
  let captured;
  const client = setupInterceptors(axios.create({ adapter: async (config) => {
    captured = config;
    return { data: {}, status: 200, statusText: "OK", headers: {}, config };
  } }));
  await client.request({ method, url, data: {} });
  expect(captured.headers.Authorization).toBe("Bearer admin-token");
  expect(captured.metadata.authContext).toBe("platform");
});
