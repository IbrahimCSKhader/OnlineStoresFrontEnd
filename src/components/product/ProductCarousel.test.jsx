import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import ProductCarousel from "./ProductCarousel.jsx";

vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ t: x => x, dir: "rtl", locale: "he-IL" }) }));
afterEach(cleanup);
const products = [{ id: "p1", name: "Vase", price: 59, thumbnailUrl: "https://example.com/vase.jpg" }, { id: "p2", name: "Lamp", price: 99, thumbnailUrl: "https://example.com/lamp.jpg" }];
const show = items => render(<MemoryRouter><ProductCarousel products={items} productPath={id => `/product/${id}`} /></MemoryRouter>);

it("hides an empty carousel", () => {
  const { container } = show([]);
  expect(container.querySelector("section")).toBeNull();
});
it("links every product to its details and keeps duplicate links outside keyboard order", () => {
  const { container } = show(products);
  expect(screen.getAllByRole("link")).toHaveLength(2);
  expect(screen.getByRole("link", {name:/Vase/}).getAttribute("href")).toBe("/product/p1");
  expect(container.querySelector('[aria-hidden="true"] a').tabIndex).toBe(-1);
  expect(container.querySelector("img").getAttribute("src")).toBe(products[0].thumbnailUrl);
});
it("pauses and resumes animation", () => {
  const { container } = show(products);
  fireEvent.click(screen.getByRole("button", {name:"إيقاف الحركة"}));
  expect(container.querySelector(".is-paused")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", {name:"تشغيل الحركة"}));
  expect(container.querySelector(".is-paused")).toBeNull();
});
it("does not duplicate or animate a single product", () => {
  const { container } = show(products.slice(0,1));
  expect(container.querySelectorAll("a")).toHaveLength(1);
  expect(container.querySelector(".is-static")).not.toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
});
