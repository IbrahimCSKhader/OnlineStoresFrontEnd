import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CategoryForm from "./CategoryForm.jsx";

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:category-preview");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

function Form({ imageUrl = "" }) {
  const [form, setForm] = useState({ name: "غرف نوم", imageUrl, imageFile: null, description: "", displayOrder: "1", parentCategoryId: "", isActive: true });
  return <CategoryForm form={form} categories={[]} onChange={(key, value) => setForm(p => ({ ...p, [key]: value }))} onSubmit={e => e.preventDefault()} />;
}

it("offers a device upload instead of a URL field and previews the selection", async () => {
  const { unmount } = render(<Form />);
  expect(screen.queryByPlaceholderText("https://...")).toBeNull();
  expect(screen.getByText("رفع صورة من الجهاز")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("صورة التصنيف"), { target: { files: [new File(["png"], "bedroom.png", { type: "image/png" })] } });
  await waitFor(() => expect(screen.getByAltText("معاينة صورة التصنيف")).toHaveAttribute("src", "blob:category-preview"));
  expect(screen.getByText("bedroom.png")).toBeInTheDocument();
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:category-preview");
});

it("preserves an existing image when an invalid or oversized file is selected", () => {
  render(<Form imageUrl="/old.png" />);
  const input = screen.getByLabelText("صورة التصنيف");
  fireEvent.change(input, { target: { files: [new File(["text"], "bad.svg", { type: "image/svg+xml" })] } });
  expect(screen.getByText("اختر صورة بصيغة JPG أو PNG أو WebP.")).toBeInTheDocument();
  const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [big] } });
  expect(screen.getByText("حجم الصورة يجب أن يكون أكبر من صفر ولا يتجاوز 5 ميجابايت.")).toBeInTheDocument();
  expect(screen.getByAltText("معاينة صورة التصنيف").getAttribute("src")).toContain("/old.png");
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
