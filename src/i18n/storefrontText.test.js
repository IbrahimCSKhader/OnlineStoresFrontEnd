import { describe, expect, it } from "vitest";
import { parse } from "@babel/parser";
import { storefrontTextRows, translateStorefrontText } from "./storefrontText.js";

describe("storefront copy", () => {
  it("covers every literal translation key used by storefront components", () => {
    const files = import.meta.glob([
      "../pages/public/*.jsx", "../pages/customer/*.jsx", "../pages/auth/*.jsx",
      "../components/product/*.jsx", "../components/cart/*.jsx",
      "../components/storefront/Navbar.jsx", "../components/layout/StoreFooter.jsx",
      "../components/order/CheckoutForm.jsx", "../layout/StoreLayout.jsx",
      "!../**/*.test.jsx",
    ], { query: "?raw", import: "default", eager: true });
    const registered = new Set(storefrontTextRows.map(x => x[0]));
    function visit(node, filename) {
      if (!node || typeof node !== "object") return;
      if (node.type === "CallExpression" && node.callee?.name === "t" && node.arguments[0]?.type === "StringLiteral") {
        expect(registered.has(node.arguments[0].value), filename + ": " + node.arguments[0].value).toBe(true);
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(x => visit(x, filename));
        else if (value && typeof value === "object") visit(value, filename);
      }
    }
    for (const [filename, source] of Object.entries(files)) {
      visit(parse(source, { sourceType: "module", plugins: ["jsx"] }), filename);
    }
  });

  it("provides English and Hebrew for every registered string", () => {
    const sources = new Set();
    for (const [source, english, hebrew] of storefrontTextRows) {
      expect(sources.has(source), source).toBe(false);
      sources.add(source);
      expect(english, source).toBeTruthy();
      expect(hebrew, source).toBeTruthy();
      expect(english, source).not.toMatch(/[\u0600-\u06ff]/);
      expect(hebrew, source).not.toMatch(/[\u0600-\u06ff]/);
      const placeholders = (text) => [...text.matchAll(/\{\d+\}/g)].map(x => x[0]).sort();
      expect(placeholders(hebrew), source).toEqual(placeholders(source));
      expect(placeholders(english), source).toEqual(placeholders(source));
    }
  });

  it("interpolates counts while preserving arbitrary merchant content", () => {
    expect(translateStorefrontText("I", "المتوفر: {0}", 12)).toBe("במלאי: 12");
    expect(translateStorefrontText("E", "خصم {0}%", 20)).toBe("20% off");
    expect(translateStorefrontText("A", "المتوفر: {0}", 12)).toBe("المتوفر: 12");
    expect(translateStorefrontText("I", "shomanhome")).toBe("shomanhome");
  });
});
