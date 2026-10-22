import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import StoreRegister from "./StoreRegister.jsx";
import axiosInstance from "../../API/axiosInstance.js";
vi.mock("../../API/axiosInstance.js", () => ({ default: { post: vi.fn(async () => ({ id: "s", slug: "demo" })) } }));
vi.mock("../../API/auth.api.js", () => ({ default: { createOwner: async () => ({ id: "owner" }) } }));
vi.mock("../../utils/metaPixel.js", () => ({ trackCompleteRegistration: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it.each([false, true])("registration sends isCatalog=%s as multipart form data", async isCatalog => {
  render(<MemoryRouter><StoreRegister /></MemoryRouter>);
  const selector = screen.getByRole("combobox", { name: "نوع الصفحة" });
  expect(selector).toHaveTextContent("متجر");
  if (isCatalog) {
    fireEvent.mouseDown(selector);
    fireEvent.click(screen.getByRole("option", { name: "كاتالوج" }));
  }
  for (const [label, value] of [["الاسم الأول", "Test"], ["اسم العائلة", "Owner"],
    ["البريد الإلكتروني", "owner@example.com"], ["كلمة المرور", "Password123!"], ["اسم المتجر", "demo"]]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.submit(screen.getByRole("button", { name: "إنشاء المتجر" }).closest("form"));
  await waitFor(() => expect(axiosInstance.post).toHaveBeenCalled());
  const payload = axiosInstance.post.mock.calls[0][1];
  expect(payload).toBeInstanceOf(FormData);
  expect(payload.get("isCatalog")).toBe(String(isCatalog));
});
