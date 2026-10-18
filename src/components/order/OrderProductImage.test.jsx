import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import OrderProductImage from "./OrderProductImage.jsx";
afterEach(cleanup);
it("falls back to the product photo if the variant photo cannot load", () => {
  render(<OrderProductImage item={{ productName: "Bed", effectiveVariantImageUrl: "/missing.jpg", productImageUrl: "/bed.jpg" }} />);
  fireEvent.error(screen.getByAltText("Bed"));
  expect(screen.getByAltText("Bed").getAttribute("src")).toContain("/bed.jpg");
});
it("prefers the purchased variant image",()=>{
  render(<OrderProductImage item={{productName:"Lipstick",effectiveVariantImageUrl:"https://example.com/variant.jpg",productImageUrl:"https://example.com/product.jpg"}} />);
  expect(screen.getByAltText("Lipstick").getAttribute("src")).toBe("https://example.com/variant.jpg");
});
it("uses the product fallback without a variant image",()=>{
  render(<OrderProductImage item={{productName:"Serum",productImageUrl:"https://example.com/serum.jpg"}} />);
  expect(screen.getByAltText("Serum").getAttribute("src")).toBe("https://example.com/serum.jpg");
});
it("handles missing and broken images without a broken image element",()=>{
  const {rerender}=render(<OrderProductImage item={{productName:"Serum"}} />);
  expect(screen.queryByRole("img")).toBeNull();
  rerender(<OrderProductImage item={{productName:"Serum",imageUrl:"https://example.com/broken.jpg"}} />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).toBeNull();
});
