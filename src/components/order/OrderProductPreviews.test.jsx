import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import OrderProductPreviews from "./OrderProductPreviews.jsx";

afterEach(cleanup);
const item = { productId: "p1", productName: "خزانة", variantName: "بني / كبير", quantity: 3, imageUrl: "/wardrobe.png" };
const show = order => render(<MemoryRouter><OrderProductPreviews order={order} /></MemoryRouter>);

it("shows the purchased product, option, quantity and picture together", () => {
  show({ id: "o1", productPreviews: [item], itemsCount: 1 });
  expect(screen.getByText("خزانة")).toBeInTheDocument();
  expect(screen.getByText("بني / كبير")).toBeInTheDocument();
  expect(screen.getByText("الكمية: 3")).toBeInTheDocument();
  expect(screen.getByAltText("خزانة").getAttribute("src")).toContain("/wardrobe.png");
  expect(screen.queryByRole("link")).toBeNull();
});

it("keeps long orders compact and links to all products", () => {
  show({ id: "o-long", productPreviews: Array.from({ length: 4 }, (_, i) => ({ ...item, productId: `p${i}` })), itemsCount: 7 });
  expect(screen.getAllByRole("listitem")).toHaveLength(4);
  expect(screen.getByRole("link", { name: "عرض كل منتجات الطلب" })).toHaveAttribute("href", "/owner/orders/o-long");
});

it("uses detailed items when previews are empty and keeps different options separate", () => {
  show({ id: "o1", productPreviews: [], items: [item, { ...item, variantName: "أبيض / صغير", quantity: 1 }] });
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("أبيض / صغير")).toBeInTheDocument();
});

it("renders no empty product panel for orders without item data", () => {
  const { container } = show({ id: "o1" });
  expect(container).toBeEmptyDOMElement();
});
