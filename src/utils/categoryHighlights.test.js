import { describe, expect, it } from "vitest";
import { buildBalancedCategoryHighlights } from "./categoryHighlights.js";

function product(id, categoryId, extra = {}) {
  return {
    id,
    name: id,
    categoryId,
    status: 1,
    trackInventory: false,
    ...extra,
  };
}

describe("buildBalancedCategoryHighlights", () => {
  const categories = [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
    { id: "c", name: "C" },
    { id: "d", name: "D" },
  ];

  it("takes from the largest possible number of categories before repeating", () => {
    const highlights = buildBalancedCategoryHighlights(
      [
        product("a1", "a"),
        product("a2", "a"),
        product("b1", "b"),
        product("b2", "b"),
        product("c1", "c"),
        product("d1", "d"),
      ],
      categories,
      { maxItems: 5 },
    );

    expect(highlights.map((item) => item.product.id)).toEqual([
      "a1",
      "b1",
      "c1",
      "d1",
      "a2",
    ]);
  });

  it("fills the remaining slots from categories that still have products", () => {
    const highlights = buildBalancedCategoryHighlights(
      [
        product("a1", "a"),
        product("a2", "a"),
        product("a3", "a"),
        product("a4", "a"),
        product("b1", "b"),
      ],
      categories,
      { maxItems: 5 },
    );

    expect(highlights.map((item) => item.product.id)).toEqual([
      "a1",
      "b1",
      "a2",
      "a3",
      "a4",
    ]);
  });

  it("never returns more than ten items by default", () => {
    const products = Array.from({ length: 14 }, (_, index) =>
      product(`p${index + 1}`, categories[index % categories.length].id),
    );

    expect(buildBalancedCategoryHighlights(products, categories)).toHaveLength(10);
  });
});
