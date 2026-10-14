import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import storeApi from "../../API/store.api.js";
import useStorefrontLanguage from "./useStorefrontLanguage.js";

vi.mock("../../API/store.api.js", () => ({
  default: { getStoreBySlug: vi.fn(), resolveStore: vi.fn() },
}));
vi.mock("../../utils/customDomain.js", () => ({
  getCurrentCustomDomainHost: () => null,
}));

function wrapperFor(route) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={client}><MemoryRouter initialEntries={[route]}>{children}</MemoryRouter></QueryClientProvider>;
  };
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  storeApi.getStoreBySlug.mockImplementation(async (slug) => ({ id: slug, slug, language: slug === "shomanhome" ? "I" : "A" }));
});

describe("storefront language", () => {
  it("uses a Hebrew store default without a URL language and ignores the old global preference", async () => {
    window.localStorage.setItem("mawja.storefront.language", "A");
    const { result } = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/market/shomanhome") });
    await waitFor(() => expect(result.current.language).toBe("I"));
    expect(result.current.t("السلة")).toBe("עגלה");
    expect(result.current.locale).toBe("he");
    expect(result.current.dir).toBe("rtl");
  });

  it("allows an explicit Arabic override on a Hebrew store", async () => {
    const { result } = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/market/shomanhome?lang=A") });
    expect(result.current.language).toBe("A");
    await waitFor(() => expect(storeApi.getStoreBySlug).toHaveBeenCalled());
    expect(result.current.language).toBe("A");
  });

  it("stores a preference under the current store only", async () => {
    const first = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/market/shomanhome") });
    await waitFor(() => expect(first.result.current.language).toBe("I"));
    act(() => first.result.current.setLanguage("E"));
    expect(first.result.current.language).toBe("E");
    expect(localStorage.getItem("mawja.storefront.language:shomanhome")).toBe("E");
    first.unmount();
    const second = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/market/another") });
    await waitFor(() => expect(second.result.current.isLanguageLoading).toBe(false));
    expect(second.result.current.language).toBe("A");
  });

  it("leaves platform routes Arabic even with a Hebrew URL or preference", () => {
    localStorage.setItem("mawja.storefront.language:shomanhome", "I");
    const { result } = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/about?lang=I") });
    expect(result.current.language).toBe("A");
    expect(result.current.t("السلة")).toBe("السلة");
    expect(storeApi.getStoreBySlug).not.toHaveBeenCalled();
  });
});
