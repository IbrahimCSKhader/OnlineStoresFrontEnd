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
