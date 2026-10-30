import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import ProductCard from "./ProductCard.jsx";

vi.mock("../../hooks/offers/useOffers.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ t: text => text }) }));
afterEach(cleanup);
const product = { id: "p", storeId: "s", name: "Test item", stockQuantity: 3, trackInventory: true, isInStock: true, price: 10 };
const show = (props = {}) => render(<MemoryRouter><ProductCard product={product} storeSlug="demo" onAddToCart={vi.fn()} {...props} /></MemoryRouter>);
const increase = () => fireEvent.click(screen.getByRole("button", { name: "زيادة الكمية" }));
const count = () => screen.getByLabelText("الكمية", { selector: "output" });

it("adds exactly the selected quantity once and resets only after success", async () => {
  let finish;
  const onAddToCart = vi.fn(() => new Promise(resolve => { finish = resolve; }));
  show({ onAddToCart });
  expect(screen.getByRole("button", { name: "أضف" })).toBeDisabled();
  expect(count()).toHaveTextContent("0");
  increase(); increase();
  fireEvent.click(screen.getByRole("button", { name: "أضف" }));
  expect(onAddToCart).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: "p" }), 2);
  expect(count()).toHaveTextContent("2");
  expect(screen.getByRole("button", { name: "زيادة الكمية" })).toBeDisabled();
  await act(async () => finish({}));
  await waitFor(() => expect(count()).toHaveTextContent("0"));
});

it("keeps the selection on failure so it can be retried", async () => {
  const onAddToCart = vi.fn().mockRejectedValueOnce(new Error("Network")).mockResolvedValueOnce({});
  show({ onAddToCart }); increase(); increase();
  fireEvent.click(screen.getByRole("button", { name: "أضف" }));
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(count()).toHaveTextContent("2");
  fireEvent.click(screen.getByRole("button", { name: "أضف" }));
  await waitFor(() => expect(count()).toHaveTextContent("0"));
  expect(onAddToCart).toHaveBeenCalledTimes(2);
});

it("clamps at zero and the chosen variant's stock", () => {
  show({ product: { ...product, defaultVariantId: "v", variants: [{ id: "v", isActive: true, stockQuantity: 2 }] } });
  expect(screen.getByRole("button", { name: "تقليل الكمية" })).toBeDisabled();
  increase(); increase(); increase();
  expect(count()).toHaveTextContent("2");
  expect(screen.getByRole("button", { name: "زيادة الكمية" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "تقليل الكمية" }));
  expect(count()).toHaveTextContent("1");
});

it.each([{ disableCartActions: true }, { product: { ...product, isInStock: false, stockQuantity: 0 } }])("disables quantity in previews and for unavailable items", props => {
  show(props);
  expect(screen.getByRole("button", { name: "زيادة الكمية" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "أضف" })).toBeDisabled();
});

it("omits purchase controls for catalogs", () => {
  show({ onAddToCart: undefined });
  expect(screen.queryByRole("group", { name: "الكمية" })).not.toBeInTheDocument();
});
