import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StoreAppearanceDialog from "./StoreAppearanceDialog.jsx";
import axiosInstance from "../../API/axiosInstance.js";

vi.mock("../../API/axiosInstance.js", () => ({ default: { get: vi.fn(), put: vi.fn() } }));
const initial = { light: {}, dark: { primary: "#800080" } };
const store = { id: "store-a", name: "متجر تجريبي", themeTemplate: "R" };

function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><StoreAppearanceDialog store={store} onClose={vi.fn()} /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  axiosInstance.get.mockResolvedValue({ data: structuredClone(initial) });
  axiosInstance.put.mockImplementation(async (_, draft) => ({ data: draft }));
});

describe("store appearance editor", () => {
  it("previews changes without saving and saves both sparse modes independently", async () => {
    open();
    const primary = await screen.findByRole("textbox", { name: "اللون الرئيسي" });
    expect(primary.value).toBe("");
    fireEvent.change(primary, { target: { value: "#ff0000" } });
    expect(document.querySelector(".store-appearance-preview").style.getPropertyValue("--primary")).toBe("#ff0000");
    expect(axiosInstance.put).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("tab", { name: "الوضع الداكن" }));
    expect(screen.getByRole("textbox", { name: "اللون الرئيسي" }).value).toBe("#800080");
    fireEvent.click(screen.getByRole("tab", { name: "الوضع الفاتح" }));
    expect(screen.getByRole("textbox", { name: "اللون الرئيسي" }).value).toBe("#ff0000");
    fireEvent.click(screen.getByRole("button", { name: "حفظ المظهر" }));
    await waitFor(() => expect(axiosInstance.put).toHaveBeenCalledWith("/api/Store/store-a/appearance", { light: { primary: "#ff0000" }, dark: { primary: "#800080" } }));
    await screen.findByText("تم حفظ مظهر المتجر.");
  });

  it("resets the selected mode while retaining the other mode", async () => {
    open();
    await screen.findByRole("textbox", { name: "اللون الرئيسي" });
    fireEvent.click(screen.getByRole("tab", { name: "الوضع الداكن" }));
    fireEvent.click(screen.getByRole("button", { name: "إعادة ضبط الوضع الحالي" }));
    expect(screen.getByRole("textbox", { name: "اللون الرئيسي" }).value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "حفظ المظهر" }));
    await waitFor(() => expect(axiosInstance.put).toHaveBeenCalledWith(expect.any(String), { light: {}, dark: {} }));
  });

  it("blocks invalid values and offers a retry after API failure", async () => {
    open();
    const primary = await screen.findByRole("textbox", { name: "اللون الرئيسي" });
    fireEvent.change(primary, { target: { value: "bad" } });
    expect(screen.getByRole("button", { name: "حفظ المظهر" })).toBeDisabled();
    fireEvent.change(primary, { target: { value: "#ff0000" } });
    axiosInstance.put.mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(screen.getByRole("button", { name: "حفظ المظهر" }));
    await screen.findByText(/تعذر حفظ المظهر|offline/);
    expect(screen.getByRole("textbox", { name: "اللون الرئيسي" }).value).toBe("#ff0000");
    expect(screen.getByRole("button", { name: "حفظ المظهر" })).toBeEnabled();
  });
});
