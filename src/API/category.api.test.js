import { beforeEach, expect, it, vi } from "vitest";
import categoryApi from "./category.api.js";
import axiosInstance from "./axiosInstance.js";

vi.mock("./axiosInstance.js", () => ({ default: { post: vi.fn(), put: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

it("uploads the selected file and category fields as multipart on create", () => {
  const imageFile = new File(["image"], "bedroom.png", { type: "image/png" });
  categoryApi.createCategory({ name: "غرف نوم", storeId: "store-1", displayOrder: 0, imageFile });
  const [, body, config] = axiosInstance.post.mock.calls[0];
  expect(body).toBeInstanceOf(FormData);
  expect(body.get("ImageFile")).toBe(imageFile);
  expect(body.get("name")).toBe("غرف نوم");
  expect(body.get("displayOrder")).toBe("0");
  expect(config.headers["Content-Type"]).toBeUndefined();
});

it("replaces the image on edit and preserves false and zero values", () => {
  const imageFile = new File(["image"], "new.webp", { type: "image/webp" });
  categoryApi.updateCategory("cat-1", { Name: "أثاث", IsActive: false, DisplayOrder: 0, imageFile });
  const [, body] = axiosInstance.put.mock.calls[0];
  expect(body.get("ImageFile")).toBe(imageFile);
  expect(body.get("IsActive")).toBe("false");
  expect(body.get("DisplayOrder")).toBe("0");
});

it("keeps the existing JSON contract and image when no new file is selected", () => {
  categoryApi.updateCategory("cat-1", { Name: "غرف نوم", ImageUrl: "/existing.png", imageFile: null });
  const [, body, config] = axiosInstance.put.mock.calls[0];
  expect(body).toEqual({ Name: "غرف نوم", ImageUrl: "/existing.png" });
  expect(config.headers["Content-Type"]).toBe("application/json");
});
