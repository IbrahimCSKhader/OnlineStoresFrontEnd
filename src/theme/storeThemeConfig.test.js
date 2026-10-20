import { describe, expect, it } from "vitest";
import { resolveStoreThemeConfig } from "./storeThemeConfig.js";
import { STORE_THEME_TEMPLATES, normalizeStoreThemeTemplate } from "../constants/storeThemeTemplates.js";
import { buildThemeProfile } from "./themes.js";

describe("resolveStoreThemeConfig", () => {
  it("offers ElectroPulse and resolves both API property formats", () => {
    expect(normalizeStoreThemeTemplate(" t ")).toBe("T");
    const template = STORE_THEME_TEMPLATES.find(({ value }) => value === "T");
    expect(template).toBeDefined();
    for (const store of [{ themeTemplate: "T" }, { ThemeTemplate: " t " }]) {
      expect(resolveStoreThemeConfig(store)).toEqual({
        defaultVariant: template.darkVariant,
        availableVariants: [template.lightVariant, template.darkVariant],
      });
    }
  });

  it("swaps the exact background and action colors between ElectroPulse modes", () => {
    const light = buildThemeProfile("electropulse");
    const dark = buildThemeProfile("electropulse-dark");
    expect(light.mode).toBe("light");
    expect(dark.mode).toBe("dark");
    expect(dark.cssVars["--background"]).toBe("#101318");
    expect(dark.cssVars["--primary"]).toBe("#0391A7");
    expect(light.cssVars["--background"]).toBe(dark.cssVars["--primary"]);
    expect(light.cssVars["--primary"]).toBe(dark.cssVars["--background"]);
    expect(dark.cssVars["--button-text"]).toBe("#101318");
    expect(light.cssVars["--button-text"]).toBe("#FFFFFF");
  });
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
