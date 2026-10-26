import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import AppThemeProvider, { useAppThemeVariant } from "./AppThemeProvider.jsx";
import useStoreBranding from "./useStoreBranding.js";
import { buildThemeProfile, THEME_VARIANTS } from "./themes.js";
import { buildAppearanceCss, contrastRatio } from "./storeAppearance.js";

beforeEach(() => localStorage.clear());

describe("sparse store appearance", () => {
  it.each(THEME_VARIANTS)("preserves the complete default profile of %s", (variant) => {
    expect(buildThemeProfile(variant, { light: {}, dark: {} })).toEqual(buildThemeProfile(variant));
  });

  it("changes only the requested mode and retains unrelated defaults", () => {
    const appearance = { light: { primary: "#ff0000" } };
    const original = buildThemeProfile("light");
    const changed = buildThemeProfile("light", appearance);
    expect(changed.palette.primary).toBe("#ff0000");
    expect(changed.palette.textPrimary).toBe(original.palette.textPrimary);
    expect(changed.palette.background).toBe(original.palette.background);
    expect(changed.cssVars["--font-body"]).toBe(original.cssVars["--font-body"]);
    expect(buildThemeProfile("dark", appearance)).toEqual(buildThemeProfile("dark"));
  });

  it("scopes element rules and ignores unsafe values", () => {
    expect(buildAppearanceCss({})).toBe("");
    expect(buildAppearanceCss({ storeTitleColor: "#ff0000" })).toContain(".store-layout .page-store-details__title");
    expect(buildAppearanceCss({ productTitleFontFamily: "Tahoma", priceFontSize: "22px" })).toContain("font-size: 22px");
    expect(buildAppearanceCss({ storeTitleColor: "red; } body { display:none", priceFontSize: "999px" })).toBe("");
    expect(contrastRatio("#ffffff", "#000000")).toBe(21);
  });

  it("switches modes, stores and management areas without leaking overrides", async () => {
    const a = { id: "a", themeTemplate: "R", appearance: { light: { primary: "#ff0000", storeTitleFontSize: "42px" }, dark: { primary: "#800080" } } };
    const b = { id: "b", themeTemplate: "D" };
    const hook = renderHook(({ store, enabled }) => {
      useStoreBranding(store, { appearanceEnabled: enabled });
      return useAppThemeVariant();
    }, { wrapper: AppThemeProvider, initialProps: { store: a, enabled: true } });
    await waitFor(() => expect(hook.result.current.themeProfile.palette.primary).toBe("#ff0000"));
    expect(document.querySelector("[data-store-appearance]").textContent).toContain("42px");
    act(() => hook.result.current.setVariant("red-dark"));
    await waitFor(() => expect(hook.result.current.themeProfile.palette.primary).toBe("#800080"));
    expect(document.querySelector("[data-store-appearance]")).toBeNull();
    hook.rerender({ store: b, enabled: true });
    await waitFor(() => expect(hook.result.current.themeProfile).toEqual(buildThemeProfile("light")));
    hook.rerender({ store: a, enabled: false });
    await waitFor(() => expect(hook.result.current.themeProfile).toEqual(buildThemeProfile("red-dark")));
    hook.rerender({ store: null, enabled: true });
    await waitFor(() => expect(hook.result.current.themeProfile).toEqual(buildThemeProfile("light")));
    hook.unmount();
  });
});
