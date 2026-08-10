import { describe, expect, it } from "vitest";
import { resolveStoreThemeConfig } from "./storeThemeConfig.js";

describe("resolveStoreThemeConfig", () => {
  it.each([
    ["demo-red-corner", "red", ["red", "red-dark"]],
    ["demo-brown-market", "brown", ["brown", "brown-dark"]],
    ["demo-purple-boutique", "purple", ["purple", "purple-dark"]],
    ["demo-gold-gallery", "gold", ["gold", "gold-dark"]],
    ["demo-deep-green-shop", "deep-green", ["deep-green", "deep-green-dark"]],
    ["eman", "purple", ["purple", "purple-dark"]],
    ["isra_essence", "gold", ["gold", "gold-dark"]],
    ["Nutellalab", "brown", ["brown", "brown-dark"]],
  ])("recovers the persisted theme for %s when the API returns D", (slug, variant, variants) => {
    expect(resolveStoreThemeConfig({ slug, themeTemplate: "D" })).toEqual({
      defaultVariant: variant,
      availableVariants: variants,
    });
  });

  it("prefers an explicit supported template from the API", () => {
    expect(
      resolveStoreThemeConfig({ slug: "demo-red-corner", themeTemplate: "Y" }),
    ).toEqual({
      defaultVariant: "gold",
      availableVariants: ["gold", "gold-dark"],
    });
  });

  it("keeps unrelated default stores on the default theme", () => {
    expect(resolveStoreThemeConfig({ slug: "another-store", themeTemplate: "D" })).toEqual({
      defaultVariant: "light",
      availableVariants: ["light", "dark"],
    });
  });
});
