import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import AppThemeProvider, { useAppThemeVariant } from "./AppThemeProvider.jsx";
import useStoreBranding from "./useStoreBranding.js";
import { storageKeys } from "../utils/storage.js";

const store = { id: "electropulse-hub", themeTemplate: "T" };

function useElectroPulseTheme() {
  useStoreBranding(store);
  return useAppThemeVariant();
}

beforeEach(() => localStorage.clear());

describe("ElectroPulse visitor theme preference", () => {
  it("starts a new visitor in dark mode even with a global light preference", async () => {
    localStorage.setItem(storageKeys.themeVariant, "light");
    const hook = renderHook(useElectroPulseTheme, { wrapper: AppThemeProvider });
    await waitFor(() => expect(hook.result.current.variant).toBe("electropulse-dark"));
    expect(hook.result.current.hasStoredPreference).toBe(false);
    hook.unmount();
  });

  it("restores the visitor's chosen light mode after reopening the store", async () => {
    const first = renderHook(useElectroPulseTheme, { wrapper: AppThemeProvider });
    await waitFor(() => expect(first.result.current.variant).toBe("electropulse-dark"));
    act(() => first.result.current.setVariant("electropulse"));
    expect(first.result.current.variant).toBe("electropulse");
    expect(JSON.parse(localStorage.getItem(storageKeys.storeThemeVariants))[store.id]).toBe("electropulse");
    first.unmount();

    const reopened = renderHook(useElectroPulseTheme, { wrapper: AppThemeProvider });
    await waitFor(() => expect(reopened.result.current.variant).toBe("electropulse"));
    expect(reopened.result.current.hasStoredPreference).toBe(true);
    reopened.unmount();
  });
});
