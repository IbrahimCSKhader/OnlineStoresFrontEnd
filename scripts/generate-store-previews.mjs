import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";
import { normalizeListResponse } from "../src/utils/collections.js";
import { absoluteHttpUrl, renderStorePreview } from "./store-preview-html.mjs";

export async function generateStorePreviews({ distDir, apiUrl, frontendUrl, assetUrl = apiUrl, fetchImpl = fetch }) {
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
  const slugs = new Set();
  for (const store of stores) {
    const slug = String(store.slug || "");
    if (!/^[\p{L}\p{N}_-]+$/u.test(slug) || slugs.has(slug.toLowerCase())) {
      throw new Error(`Invalid or duplicate store slug: ${slug}`);
    }
    slugs.add(slug.toLowerCase());
    const html = renderStorePreview(template, store, { frontendUrl, assetUrl });
    const storeDirectory = path.join(distDir, "market", slug);
    await mkdir(storeDirectory, { recursive: true });
    await writeFile(path.join(storeDirectory, "index.html"), html);
    const previewDirectory = path.join(distDir, "store-previews");
    await mkdir(previewDirectory, { recursive: true });
    await writeFile(path.join(previewDirectory, `${slug}.html`), html);
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
    });
    console.log(`Generated link previews for ${count} active stores.`);
  } catch (error) {
    console.error("Store preview generation failed:", error.message);
    process.exitCode = 1;
  }
}
