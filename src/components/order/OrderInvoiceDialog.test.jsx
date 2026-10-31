import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import OrderInvoiceDialog from "./OrderInvoiceDialog.jsx";

vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ t: text => text, locale: "en", dir: "ltr" }) }));

it("opens a preview and prints only the invoice frame after it loads", async () => {
  render(<OrderInvoiceDialog data={{ orderNumber: "ORD-1", items: [], totalAmount: 0 }} store={{ name: "Shop" }} owner={{ firstName: "Owner" }} />);
  fireEvent.click(screen.getByRole("button", { name: "طباعة الفاتورة" }));
  const frame = screen.getByTitle("فاتورة الطلب");
  const print = vi.fn();
  const focus = vi.fn();
  Object.defineProperty(frame.contentWindow, "print", { value: print, configurable: true });
  Object.defineProperty(frame.contentWindow, "focus", { value: focus, configurable: true });
  const button = screen.getAllByRole("button", { name: "طباعة الفاتورة" }).find(button => button.closest('[role="dialog"]'));
  expect(button).toBeDisabled();
  fireEvent.load(frame);
  fireEvent.click(button);
  await waitFor(() => expect(print).toHaveBeenCalledOnce());
  expect(focus).toHaveBeenCalledOnce();
  expect(frame.getAttribute("srcdoc")).toContain("ORD-1");
  expect(frame.getAttribute("sandbox")).toContain("allow-modals");
});

it("does not count previewing and retries saving the same attempt without printing twice", async () => {
  const onPrint = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({});
  render(<OrderInvoiceDialog data={{ orderNumber: "ORD-1", items: [] }} store={{ name: "Shop" }} owner={{}} onPrint={onPrint} autoOpen />);
  expect(onPrint).not.toHaveBeenCalled();
  const frame = screen.getByTitle("فاتورة الطلب");
  const print = vi.fn();
  Object.defineProperty(frame.contentWindow, "print", { value: print, configurable: true });
  Object.defineProperty(frame.contentWindow, "focus", { value: vi.fn(), configurable: true });
  fireEvent.load(frame);
  const button = screen.getAllByRole("button", { name: "طباعة الفاتورة" }).find(b => b.closest('[role="dialog"]'));
  fireEvent.click(button);
  await screen.findByText("تم فتح الطباعة، لكن تعذر حفظ العداد. أعد حفظ المحاولة دون طباعة جديدة.");
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "إعادة حفظ المحاولة" }));
  await waitFor(() => expect(onPrint).toHaveBeenCalledTimes(2));
  expect(onPrint.mock.calls[0][0]).toBe(onPrint.mock.calls[1][0]);
  expect(print).toHaveBeenCalledOnce();
  await waitFor(() => expect(button).not.toBeDisabled());
});

it("refreshes image preview without counting a print attempt", () => {
  const onPrint = vi.fn();
  render(<OrderInvoiceDialog autoOpen data={{ items: [{ productName: "Juice", productImageUrl: "/juice.jpg", quantity: 1, unitPrice: 5 }] }} store={{}} owner={{}} onPrint={onPrint} />);
  const frame = screen.getByTitle("فاتورة الطلب");
  const option = screen.getByRole("checkbox", { name: "طباعة صور المنتجات" });
  const button = screen.getAllByRole("button", { name: "طباعة الفاتورة" }).find(b => b.closest('[role="dialog"]'));
  expect(option).not.toBeChecked();
  fireEvent.load(frame);
  fireEvent.click(option);
  expect(frame.getAttribute("srcdoc")).toContain('class="product-image"');
  expect(button).toBeDisabled();
  expect(onPrint).not.toHaveBeenCalled();
  fireEvent.load(frame);
  expect(button).not.toBeDisabled();
  fireEvent.click(option);
  expect(frame.getAttribute("srcdoc")).not.toContain('class="product-image"');
});
