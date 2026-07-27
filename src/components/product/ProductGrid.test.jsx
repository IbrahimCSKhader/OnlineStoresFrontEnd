import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ProductGrid, { ProductGridSkeleton } from "./ProductGrid.jsx";

const products = [
  {
    id: "p-1",
    name: "Ultra premium zaatar blend with a deliberately long display name",
    categoryName: "Pantry",
    shortDescription:
      "A long product description that should stay visually compact inside the card.",
    finalPrice: 18,
    originalPrice: 24,
    stockQuantity: 12,
    trackInventory: true,
    thumbnailUrl: "https://example.com/zaatar.jpg",
  },
  {
    id: "p-2",
    name: "Olive oil gift box",
    categoryName: "Gifts",
    shortDescription: "Compact gift set.",
    finalPrice: 42,
    stockQuantity: 4,
    trackInventory: true,
    thumbnailUrl: "https://example.com/oil.jpg",
  },
];

function renderProductGrid(ui) {
  return render(
    <MemoryRouter initialEntries={["/store/iz3tr"]}>
      {ui}
    </MemoryRouter>,
  );
}

describe("ProductGrid", () => {
  it("renders product cards inside lazy shells without hiding visible products", () => {
    const onAddToCart = vi.fn();
    const { container } = renderProductGrid(
      <ProductGrid
        products={products}
        storeSlug="iz3tr"
        onAddToCart={onAddToCart}
      />,
    );

    expect(container.querySelector(".storefront-products-grid")).toBeInTheDocument();
    expect(container.querySelectorAll(".product-card-lazy-shell")).toHaveLength(2);
    expect(container.querySelectorAll(".product-card")).toHaveLength(2);
    expect(screen.getByText(products[0].name)).toBeVisible();
    expect(screen.getByText(products[1].name)).toBeVisible();

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("loading", "lazy");
    expect(images[0]).toHaveAttribute("decoding", "async");
  });

  it("renders the requested number of skeleton product cards", () => {
    const { container } = render(<ProductGridSkeleton count={3} />);

    expect(container.querySelectorAll(".product-card--skeleton")).toHaveLength(3);
    expect(container.querySelectorAll(".product-card__skeleton-media")).toHaveLength(3);
    expect(container.querySelector(".storefront-products-grid")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
