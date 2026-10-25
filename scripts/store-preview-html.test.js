// @vitest-environment node
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, expect, it, vi } from "vitest";
import { renderStorePreview } from "./store-preview-html.mjs";
import { generateStorePreviews } from "./generate-store-previews.mjs";

const shell = '<!doctype html><html lang="ar" dir="rtl"><head><title>mawja</title><link rel="icon" href="/mawja%20logo.jpeg"><script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css"></head><body><div id="root"></div></body></html>';
const settings = { frontendUrl: "https://mawja.site", assetUrl: "https://api.example" };
const store = { slug: "test-shop", name: "Test store", description: "A store", logoUrl: "/uploads/logo.jpeg", language: "E" };
let temporaryDirectory;
afterEach(async () => { if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true }); temporaryDirectory = undefined; });

it("renders the store in the initial HTML while retaining the React shell", () => {
  const html = renderStorePreview(shell, store, settings);
  const document = new JSDOM(html).window.document;
  expect(document.title).toBe(store.name);
  expect(document.querySelector('meta[property="og:image"]').content).toBe("https://api.example/uploads/logo.jpeg");
  expect(document.querySelector('meta[property="og:url"]').content).toBe("https://mawja.site/market/test-shop");
  expect(document.querySelector('link[rel="icon"]').href).toBe("https://api.example/uploads/logo.jpeg");
  expect(document.querySelector('script[type="module"]').getAttribute("src")).toBe("/assets/app.js");
  expect(document.querySelector('link[rel="stylesheet"]').getAttribute("href")).toBe("/assets/app.css");
  expect(document.documentElement.lang).toBe("en");
  expect(html).not.toContain("mawja%20logo.jpeg");
});
it("escapes store data and replaces metadata without duplicates", () => {
  const name = 'Shop " ><script>alert(1)</script> & friends';
  const html = renderStorePreview(renderStorePreview(shell, store, settings), { ...store, name, logoUrl: 'https://cdn.example/logo.png?a=1&b=2' }, settings);
  const document = new JSDOM(html).window.document;
  expect(document.title).toBe(name);
  expect(document.querySelector('meta[property="og:title"]').content).toBe(name);
  expect(document.querySelectorAll('meta[property="og:image"]')).toHaveLength(1);
  expect(document.querySelectorAll("script")).toHaveLength(1);
});
it("uses the cover for a missing logo and never accepts script or data image URLs", () => {
  const document = new JSDOM(renderStorePreview(shell, { ...store, logoUrl: "javascript:alert(1)", coverImageUrl: "/cover.jpg" }, settings)).window.document;
  expect(document.querySelector('meta[property="og:image"]').content).toBe("https://api.example/cover.jpg");
  const missing = new JSDOM(renderStorePreview(shell, { ...store, logoUrl: "data:text/html,evil" }, settings)).window.document;
  expect(missing.querySelector('meta[property="og:image"]')).toBeNull();
  expect(missing.querySelector('link[rel="icon"]')).toBeNull();
});
async function generateWith(stores, fetchImpl = vi.fn(async () => ({ ok: true, json: async () => stores }))) {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "mawja-previews-"));
  await writeFile(path.join(temporaryDirectory, "index.html"), shell);
  return generateStorePreviews({ ...settings, apiUrl: "https://api.example", distDir: temporaryDirectory, fetchImpl });
}
it("generates isolated previews for all active stores and leaves the platform homepage intact", async () => {
  expect(await generateWith([store, { ...store, slug: "other", name: "متجر ثاني", logoUrl: "/second.png", language: "A" }, { ...store, slug: "inactive", isActive: false }])).toBe(2);
  const first = await readFile(path.join(temporaryDirectory, "store-previews/test-shop.html"), "utf8");
  const second = await readFile(path.join(temporaryDirectory, "market/other/index.html"), "utf8");
  expect(first).toContain("https://api.example/uploads/logo.jpeg");
  expect(first).not.toContain("second.png");
  expect(second).toContain("https://api.example/second.png");
  expect(second).toContain('dir="rtl"');
  expect(await readFile(path.join(temporaryDirectory, "index.html"), "utf8")).toBe(shell);
  await expect(readFile(path.join(temporaryDirectory, "store-previews/inactive.html"))).rejects.toThrow();
});
it.each(["../escape", "a/b", "", "."])("rejects unsafe slug %s", async slug => {
  await expect(generateWith([{ ...store, slug }])).rejects.toThrow("Invalid or duplicate store slug");
});
it("fails the build on API failure or empty data rather than publishing missing previews", async () => {
  const request = vi.fn(async () => { throw new Error("API unavailable"); });
  await expect(generateWith([], request)).rejects.toThrow("API unavailable");
  expect(request).toHaveBeenCalledTimes(2);
});
it("rejects an empty store response", async () => {
  await expect(generateWith([])).rejects.toThrow("no active stores");
});
