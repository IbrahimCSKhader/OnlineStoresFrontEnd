import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";
import { normalizeListResponse } from "../src/utils/collections.js";
import { absoluteHttpUrl, renderStorePreview } from "./store-preview-html.mjs";
import { prepareStorePreviewImage } from "./store-preview-image.mjs";

export function normalizeStorefrontDomain(value) {
  const url = new URL(String(value).includes("://") ? value : `https://${value}`);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
      url.port || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("STOREFRONT_DOMAIN must contain only a domain name.");
  }
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

export async function generateStorePreviews({ distDir, apiUrl, frontendUrl, assetUrl = apiUrl, storefrontDomain, fetchImpl = fetch, prepareImage = prepareStorePreviewImage }) {
  if (!absoluteHttpUrl(apiUrl) || !absoluteHttpUrl(frontendUrl) || !absoluteHttpUrl(assetUrl)) {
    throw new Error("Store previews require absolute HTTP(S) API, frontend, and asset URLs.");
  }
  const template = await readFile(path.join(distDir, "index.html"), "utf8");
  let response;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetchImpl(new URL("api/Store", `${apiUrl.replace(/\/+$/, "")}/`), { signal: AbortSignal.timeout(20000) });
      if (response.ok) break;
      if (response.status < 500 || attempt === 1) throw new Error(`Store API returned HTTP ${response.status}`);
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }
  if (!response?.ok) throw new Error("Unable to load stores for link previews.");
  const stores = normalizeListResponse(await response.json()).filter(store => store.isActive !== false);
  if (!stores.length) throw new Error("Store API returned no active stores; refusing to publish missing previews.");
  let domainStore;
  let domain;
  if (storefrontDomain) {
    domain = normalizeStorefrontDomain(storefrontDomain);
    const matches = stores.filter(store => {
      if (!store.customDomain) return false;
      try { return normalizeStorefrontDomain(store.customDomain) === domain; }
      catch { return false; }
    });
    if (matches.length !== 1) throw new Error(`Expected one active store assigned to domain ${domain}; found ${matches.length}.`);
    domainStore = matches[0];
  }
  const slugs = new Set();
  const previewImages = new Map();
  for (const store of stores) {
    const slug = String(store.slug || "");
    if (!/^[\p{L}\p{N}_-]+$/u.test(slug) || slugs.has(slug.toLowerCase())) {
      throw new Error(`Invalid or duplicate store slug: ${slug}`);
    }
    slugs.add(slug.toLowerCase());
    let previewImage;
    try {
      previewImage = await prepareImage(store, { distDir, assetUrl, frontendUrl, fetchImpl });
    } catch (error) {
      // An unavailable third-party logo must not take the storefront offline.
      console.warn(`Preview image for ${slug}: ${error.message}; retaining original image URL.`);
    }
    previewImages.set(slug, previewImage);
    const html = renderStorePreview(template, store, { frontendUrl, assetUrl, previewImage });
    const storeDirectory = path.join(distDir, "market", slug);
    await mkdir(storeDirectory, { recursive: true });
    await writeFile(path.join(storeDirectory, "index.html"), html);
    const previewDirectory = path.join(distDir, "store-previews");
    await mkdir(previewDirectory, { recursive: true });
    await writeFile(path.join(previewDirectory, `${slug}.html`), html);
  }
  if (domainStore) {
    await writeFile(path.join(distDir, "index.html"), renderStorePreview(template, domainStore, {
      frontendUrl, assetUrl, canonicalUrl: `https://${domain}/`,
      previewImage: previewImages.get(domainStore.slug) && {
        ...previewImages.get(domainStore.slug),
        url: new URL(new URL(previewImages.get(domainStore.slug).url).pathname, `https://${domain}`).href,
      },
    }));
  }
  return stores.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
  try {
    const count = await generateStorePreviews({
      distDir: path.resolve("dist"),
      apiUrl: env.VITE_API_BASE_URL || "https://mawja.premiumasp.net",
      frontendUrl: env.VITE_FRONTEND_BASE_URL || "https://mawja.site",
      assetUrl: env.VITE_ASSET_BASE_URL || env.VITE_API_BASE_URL || "https://mawja.premiumasp.net",
      storefrontDomain: env.STOREFRONT_DOMAIN,
    });
    console.log(`Generated link previews for ${count} active stores.`);
  } catch (error) {
    console.error("Store preview generation failed:", error.message);
    process.exitCode = 1;
  }
}
