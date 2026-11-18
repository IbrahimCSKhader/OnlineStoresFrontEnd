import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard.jsx";
import api from "../../API/axiosInstance.js";

vi.mock("../../hooks/stores/useOwnerStore.js", () => ({ default: () => ({ ownerStore: { id: "s", slug: "demo", name: "Demo" } }) }));
vi.mock("../../hooks/auth/useAuth.js", () => ({ default: () => ({ isAuthenticated: true, role: "StoreOwner", user: { id: "owner" } }) }));
vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ t: value => value, currency: String, dateTime: String }) }));
vi.mock("../../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../../API/axiosInstance.js", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
const product = { id: "p", storeId: "s", name: "Variant product", slug: "variant-product", status: 1, price: 20,
  stockQuantity: 10, trackInventory: true, categoryId: "cat", sectionId: "sec", images: [],
  variants: [{ id: "default", name: "Default", isDefault: true, isActive: true, stockQuantity: 10 }] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", class extends URL { static createObjectURL() { return "blob:test"; } static revokeObjectURL() {} });
  api.get.mockImplementation(async url => {
    if (url === "/api/Product/p") return structuredClone(product);
    if (url.includes("/Product/store/")) return [structuredClone(product)];
    if (url.includes("/Category/")) return [{ id: "cat", storeId: "s", name: "Category" }];
    if (url.includes("/Section/")) return [{ id: "sec", storeId: "s", name: "Section" }];
    return [];
  });
  api.put.mockImplementation(async (url, payload) => url === "/api/Product/p" ? product : {
    id: url.split("/").at(-1), name: payload.Name, stockQuantity: payload.StockQuantity, price: payload.Price,
  });
  api.post.mockImplementation(async (url, payload) => ({ id: "new-variant", name: payload.Name, stockQuantity: payload.StockQuantity, price: payload.Price }));
});
afterEach(() => vi.unstubAllGlobals());

async function edit() {
  const view = render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><Dashboard initialTab="products" /></MemoryRouter>
  </QueryClientProvider>);
  const row = await screen.findByRole("row", { name: /Variant product/ });
  fireEvent.click(within(row).getByRole("button", { name: "تعديل", exact: true }));
  await screen.findByRole("button", { name: "حفظ المنتج", exact: true });
  fireEvent.click(screen.getByRole("button", { name: "إضافة نسخة", exact: true }));
  const variant = view.container.querySelectorAll(".owner-variants__item")[1];
  fireEvent.change(within(variant).getByLabelText("اسم النسخة", { exact: true }), { target: { value: "Large" } });
  fireEvent.change(within(variant).getByLabelText("المخزون", { exact: true }), { target: { value: "5" } });
  return { ...view, variant };
}

it("saves new variants and edited existing variants through the main product save button", async () => {
  const { container } = await edit();
  const existing = container.querySelector(".owner-variants__item");
  fireEvent.change(within(existing).getByLabelText("اسم النسخة", { exact: true }), { target: { value: "Standard" } });
  fireEvent.click(screen.getByRole("button", { name: "حفظ المنتج", exact: true }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/api/Product/p/variant", expect.objectContaining({ Name: "Large", StockQuantity: 5 })));
  expect(api.put).toHaveBeenCalledWith("/api/Product/variant/default", expect.objectContaining({ Name: "Standard" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  await screen.findByRole("button", { name: "إضافة المنتج", exact: true });
}, 15000);

it("retains a saved variant and completed images when a later upload fails and is retried", async () => {
  const { variant } = await edit();
  let failSecond = true;
  const uploads = [];
  api.post.mockImplementation(async (url, payload) => {
    if (url.endsWith("/variant")) return { id: "new-variant", name: payload.Name, stockQuantity: payload.StockQuantity };
    const file = payload.get("Image");
    uploads.push(file.name);
    if (file.name === "second.png" && failSecond) throw new Error("Upload failed");
    return { id: file.name, url: `/${file.name}`, variantId: "new-variant" };
  });
  fireEvent.change(variant.querySelector('input[type="file"]'), { target: { files: [
    new File(["first"], "first.png", { type: "image/png" }), new File(["second"], "second.png", { type: "image/png" }),
  ] } });
  fireEvent.click(screen.getByRole("button", { name: "حفظ المنتج", exact: true }));
  const dialog = await screen.findByRole("dialog", { name: "Upload failed" });
  expect(within(dialog).getByRole("alert")).toHaveTextContent("Upload failed");
  fireEvent.click(within(dialog).getByRole("button"));
  failSecond = false;
  fireEvent.click(screen.getByRole("button", { name: "حفظ المنتج", exact: true }));
  await screen.findByRole("button", { name: "إضافة المنتج", exact: true });
  expect(api.post.mock.calls.filter(([url]) => url.endsWith("/variant"))).toHaveLength(1);
  expect(uploads).toEqual(["first.png", "second.png", "second.png"]);
}, 15000);
