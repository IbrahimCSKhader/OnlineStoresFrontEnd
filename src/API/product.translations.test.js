import { expect, it, vi } from "vitest";
import productApi from "./product.api.js";
import axiosInstance from "./axiosInstance.js";
vi.mock("./axiosInstance.js", () => ({ default: { post: vi.fn(), put: vi.fn() } }));
it("sends all translations and retains the language when clearing every field", () => {
  productApi.updateProduct("product-1", { Translations: [
    { language: "E", name: "Chair", description: "Oak", shortDescription: "Wood" },
    { language: "I", name: "", description: "" },
  ] });
  const [, body] = axiosInstance.put.mock.calls[0];
  expect(body.get("Translations[0].name")).toBe("Chair");
  expect(body.get("Translations[0].shortDescription")).toBe("Wood");
  expect(body.get("Translations[1].language")).toBe("I");
});
