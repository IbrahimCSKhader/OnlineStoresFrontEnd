import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const productCardCss = readFileSync(
  resolve(currentDir, "ProductCard.css"),
  "utf8",
);
const storeDetailsCss = readFileSync(
  resolve(currentDir, "../../pages/public/StoreDetails.css"),
  "utf8",
);

function cssRule(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "s"));
  return match?.[1] ?? "";
}

describe("product card layout CSS", () => {
  it("keeps product media and text compact inside each card", () => {
    expect(cssRule(productCardCss, ".product-card__media")).toContain(
      "aspect-ratio: 4 / 3",
    );
    expect(productCardCss).not.toContain("max-height: none");
    expect(cssRule(productCardCss, ".product-card__title")).toContain(
      "-webkit-line-clamp: 2",
    );
    expect(cssRule(productCardCss, ".product-card__title")).toContain(
      "overflow-wrap: anywhere",
    );
    expect(cssRule(productCardCss, ".product-card__actions")).toContain(
      "margin-top: auto",
    );
  });

  it("does not force lazy product shells to stretch to an oversized height", () => {
    const shellRule = cssRule(productCardCss, ".product-card-lazy-shell");

    expect(shellRule).toContain("min-height: 0");
    expect(shellRule).toContain("max-width: var(--product-card-max-width, 240px)");
    expect(shellRule).not.toContain("height: 100%");
  });

  it("uses bounded responsive cards in the store products section", () => {
    const catalogGridRule = cssRule(
      storeDetailsCss,
      ".page-store-details__catalog .storefront-products-grid",
    );
    const itemRule = cssRule(
      storeDetailsCss,
      ".page-store-details__catalog .storefront-products-grid > *",
    );

    expect(catalogGridRule).toContain("display: grid");
    expect(catalogGridRule).toContain(
      "repeat(auto-fill, minmax(min(190px, 100%), 230px))",
    );
    expect(catalogGridRule).toContain("justify-content: start");
    expect(itemRule).toContain("max-width: 100%");
  });

  it("centers product pagination controls", () => {
    expect(cssRule(productCardCss, ".product-pagination")).toContain(
      "justify-content: center",
    );
    expect(cssRule(productCardCss, ".product-pagination .MuiPagination-ul")).toContain(
      "justify-content: center",
    );
  });
});
