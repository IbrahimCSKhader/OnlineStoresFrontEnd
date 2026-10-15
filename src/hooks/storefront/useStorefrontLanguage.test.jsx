import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import storeApi from "../../API/store.api.js";
import useStorefrontLanguage from "./useStorefrontLanguage.js";
import { getCurrentCustomDomainHost } from "../../utils/customDomain.js";

vi.mock("../../API/store.api.js", () => ({
  default: { getStoreBySlug: vi.fn(), resolveStore: vi.fn() },
}));
vi.mock("../../utils/customDomain.js", () => ({
  getCurrentCustomDomainHost: vi.fn(() => null),
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
  getCurrentCustomDomainHost.mockReturnValue(null);
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

  it.each(["lang=A", "language=E", "language=A&lang=E"])("ignores URL overrides: %s", async (query) => {
    const { result } = renderHook(useStorefrontLanguage, { wrapper: wrapperFor(`/market/shomanhome?${query}`) });
    await waitFor(() => expect(result.current.isLanguageLoading).toBe(false));
    expect(result.current.language).toBe("I");
    expect(result.current.setLanguage).toBeUndefined();
  });

  it("ignores store-scoped browser preferences and keeps other stores independent", async () => {
    localStorage.setItem("mawja.storefront.language:shomanhome", "E");
    localStorage.setItem("mawja.storefront.language:another", "I");
    const first = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/market/shomanhome") });
    await waitFor(() => expect(first.result.current.language).toBe("I"));
    first.unmount();
    const second = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/market/another") });
    await waitFor(() => expect(second.result.current.isLanguageLoading).toBe(false));
    expect(second.result.current.language).toBe("A");
  });

  it.each(["A", "E", "I"])("uses backend language %s on a custom domain", async (language) => {
    getCurrentCustomDomainHost.mockReturnValue("alkarmel.net");
    storeApi.resolveStore.mockResolvedValue({ id: "store", language });
    localStorage.setItem("mawja.storefront.language:alkarmel.net", "E");
    const { result } = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/products?lang=A") });
    await waitFor(() => expect(result.current.isLanguageLoading).toBe(false));
    expect(result.current.language).toBe(language);
    expect(storeApi.resolveStore).toHaveBeenCalledWith({ host: "alkarmel.net" });
  });

  it("falls back to Arabic when the backend has no language", async () => {
    storeApi.getStoreBySlug.mockResolvedValue({ id: "legacy" });
    const { result } = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/market/legacy?lang=I") });
    await waitFor(() => expect(result.current.isLanguageLoading).toBe(false));
    expect(result.current.language).toBe("A");
  });

  it("leaves platform routes Arabic even with a Hebrew URL or preference", () => {
    localStorage.setItem("mawja.storefront.language:shomanhome", "I");
    const { result } = renderHook(useStorefrontLanguage, { wrapper: wrapperFor("/about?lang=I") });
    expect(result.current.language).toBe("A");
    expect(result.current.t("السلة")).toBe("السلة");
    expect(storeApi.getStoreBySlug).not.toHaveBeenCalled();
  });
});
