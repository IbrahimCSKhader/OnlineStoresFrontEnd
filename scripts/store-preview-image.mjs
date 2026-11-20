import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { absoluteHttpUrl } from "./store-preview-html.mjs";

// Publish a small, public JPEG beside the HTML, so sharing clients need not
// connect to the API host or decode SVG/WebP logos to display a thumbnail.
export async function prepareStorePreviewImage(store, { distDir, assetUrl, frontendUrl, fetchImpl = fetch }) {
  const source = absoluteHttpUrl(store.logoUrl, assetUrl) || absoluteHttpUrl(store.coverImageUrl, assetUrl);
  if (!source) return undefined;
  const response = await fetchImpl(source, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Image returned HTTP ${response.status}`);
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > 8 * 1024 * 1024) {
      throw new Error("Preview source exceeds 8 MB");
    }
    chunks.push(chunk);
  }
  const jpeg = await sharp(Buffer.concat(chunks), { limitInputPixels: 40000000 })
    .rotate().resize(600, 600, { fit: "contain", background: "#ffffff" })
    .flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer();
  const hash = createHash("sha256").update(jpeg).digest("hex").slice(0, 16);
  const filename = `${hash}.jpg`;
  await mkdir(path.join(distDir, "store-preview-images"), { recursive: true });
  await writeFile(path.join(distDir, "store-preview-images", filename), jpeg);
  return {
    url: new URL(`/store-preview-images/${filename}`, frontendUrl).href,
    width: 600, height: 600, type: "image/jpeg",
  };
}
