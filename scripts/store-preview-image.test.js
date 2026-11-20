// @vitest-environment node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { it, expect } from "vitest";
import { prepareStorePreviewImage } from "./store-preview-image.mjs";

it("creates a public square JPEG from a transparent logo and versions changed content", async () => {
  const distDir = await mkdtemp(path.join(os.tmpdir(), "preview-images-"));
  try {
    let color = "red";
    const options = { distDir, assetUrl: "https://api.example", frontendUrl: "https://mawja.site", fetchImpl: async () => new Response(await sharp({ create: { width: 200, height: 400, channels: 4, background: color } }).png().toBuffer()) };
    const store = { logoUrl: "/logo.png" };
    const first = await prepareStorePreviewImage(store, options);
    const jpeg = await readFile(path.join(distDir, new URL(first.url).pathname));
    const metadata = await sharp(jpeg).metadata();
    expect(metadata).toMatchObject({ width: 600, height: 600, format: "jpeg", hasAlpha: false });
    expect(jpeg.length).toBeLessThan(300000);
    expect(new URL(first.url).origin).toBe("https://mawja.site");
    expect(await prepareStorePreviewImage(store, options)).toEqual(first);
    color = "blue";
    expect((await prepareStorePreviewImage(store, options)).url).not.toBe(first.url);
    await expect(prepareStorePreviewImage(store, { ...options, fetchImpl: async () => new Response("missing", { status: 404 }) })).rejects.toThrow("HTTP 404");
    expect(await prepareStorePreviewImage({}, options)).toBeUndefined();
  } finally {
    await rm(distDir, { recursive: true, force: true });
  }
});
