import { describe, expect, it } from "vitest";
import { resolveStoreThemeConfig } from "./storeThemeConfig.js";
import { STORE_THEME_TEMPLATES, normalizeStoreThemeTemplate } from "../constants/storeThemeTemplates.js";
import { buildThemeProfile } from "./themes.js";
import { relativeLuminance } from "./branding.js";

describe("resolveStoreThemeConfig", () => {
  it("keeps the App Navbar template in both branded color modes", () => {
    const theme = resolveStoreThemeConfig({ themeTemplate: "O" });
    expect(theme.defaultVariant).toBe("app-navbar-dark");
    expect(theme.availableVariants.map(variant => buildThemeProfile(variant).template)).toEqual(["app-navbar", "app-navbar"]);
  });
  it("keeps pink dark button text readable across both ends of its gradient", () => {
    const { palette } = buildThemeProfile("pink-dark");
    const text = relativeLuminance(palette.buttonText);
    for (const background of [palette.primary, palette.primaryContainer]) {
      const fill = relativeLuminance(background);
      expect((Math.max(text, fill) + 0.05) / (Math.min(text, fill) + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("offers ElectroPulse and resolves both API property formats", () => {
    expect(normalizeStoreThemeTemplate(" t ")).toBe("T");
    const template = STORE_THEME_TEMPLATES.find(({ value }) => value === "T");
    expect(template).toBeDefined();
    expect(template.label).toBe("قرمزي");
    for (const store of [{ themeTemplate: "T" }, { ThemeTemplate: " t " }]) {
      expect(resolveStoreThemeConfig(store)).toEqual({
        defaultVariant: template.darkVariant,
        availableVariants: [template.lightVariant, template.darkVariant],
      });
    }
  });

  it("uses a pale silver light background and preserves the dark palette", () => {
    const light = buildThemeProfile("electropulse");
    const dark = buildThemeProfile("electropulse-dark");
    expect(light.mode).toBe("light");
    expect(dark.mode).toBe("dark");
    expect(dark.cssVars["--background"]).toBe("#101318");
    expect(dark.cssVars["--primary"]).toBe("#0391A7");
    expect(light.cssVars["--background"]).toBe("#F1F5F8");
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

it("keeps category-grid colors consistent with the fragrance store palette", () => {
  expect(normalizeStoreThemeTemplate(" c ")).toBe("C");
  expect(resolveStoreThemeConfig({ themeTemplate: "C" })).toEqual(resolveStoreThemeConfig({ themeTemplate: "N" }));
  expect(STORE_THEME_TEMPLATES.find(x => x.value === "C").label).toBe("العرض بناء على الاصناف");
});

 it("isolates Alaa design from all other library stores", () => {
  expect(resolveStoreThemeConfig({ slug: "alaa-rob", themeTemplate: "K" })).toEqual({ defaultVariant: "deep-green", availableVariants: ["deep-green"] });
  expect(resolveStoreThemeConfig({ slug: "another-library", themeTemplate: "K" }).defaultVariant).toBe("brown");
  expect(normalizeStoreThemeTemplate("A")).toBe("A");
  expect(STORE_THEME_TEMPLATES.find(x => x.value === "A").label).toBe("تصميم الاء");
});
