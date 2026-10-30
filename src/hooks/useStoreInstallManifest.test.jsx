import { StrictMode } from "react";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { act } from "react";
import { afterEach, expect, it } from "vitest";
import useStoreInstallManifest, { storeManifestUrl } from "./useStoreInstallManifest.js";

afterEach(() => { cleanup(); document.querySelectorAll('link[rel="manifest"]').forEach(link => link.remove()); });
const options = { slug: "shop-a", pathname: "/market/shop-a/products", origin: "https://mawja.site" };

it("preserves the exact public URL and separates store and page identities", () => {
  const url = storeManifestUrl({ ...options, search: "?sort=price&page=2", hash: "#items" });
  expect(new URL(url).searchParams.get("url")).toBe("https://mawja.site/market/shop-a/products?sort=price&page=2#items");
  expect(url).not.toBe(storeManifestUrl({ ...options, pathname: "/market/shop-a/about" }));
  expect(url).not.toBe(storeManifestUrl({ ...options, slug: "shop-b", pathname: "/market/shop-b/products" }));
  expect(new URL(storeManifestUrl({ ...options, customDomain: true, pathname: "/products", origin: "https://shop.example" })).searchParams.get("url")).toBe("https://shop.example/products");
});

it.each(["/", "/market/shop-b/products", "/market/shop-a-extra/products", "/market/shop-a/login", "/market/shop-a/checkout"])("does not install platform, other-store or private page %s", pathname => {
  expect(storeManifestUrl({ ...options, pathname })).toBe("");
});
it("does not persist tokens or preview state", () => {
  expect(storeManifestUrl({ ...options, search: "?token=secret" })).toBe("");
  expect(storeManifestUrl({ ...options, search: "?preview=owner" })).toBe("");
});

it("updates on SPA navigation, survives StrictMode and restores the platform manifest on exit", () => {
  const platform = document.createElement("link");
  platform.rel = "manifest";
  platform.href = "/manifest.json";
  document.head.appendChild(platform);
  let navigate;
  function Page() {
    navigate = useNavigate();
    useStoreInstallManifest("shop-a");
    return null;
  }
  const app = render(<StrictMode><MemoryRouter initialEntries={[options.pathname]}><Page /></MemoryRouter></StrictMode>);
  expect(document.querySelectorAll('link[rel="manifest"]')).toHaveLength(1);
  expect(document.querySelector('link[rel="manifest"]').crossOrigin).toBe("anonymous");
  expect(document.querySelector('link[rel="manifest"]').href).toContain("shop-a");
  act(() => navigate("/market/shop-a/about"));
  expect(new URL(document.querySelector('link[rel="manifest"]').href).searchParams.get("url")).toContain("/market/shop-a/about");
  act(() => navigate("/market/shop-a/login"));
  expect(document.querySelector('link[rel="manifest"]')).toBeNull();
  app.unmount();
  expect(document.querySelector('link[rel="manifest"]')).toBe(platform);
});
