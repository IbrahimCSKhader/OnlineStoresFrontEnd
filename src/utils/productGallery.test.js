import { expect, it } from "vitest";
import { getProductImagesForVariant } from "./productGallery.js";

const product = { name: "Simba", thumbnailUrl: "/simba.jpg", images: [
  { id: "primary", url: "/simba.jpg" }, { id: "back", url: "/back.jpg" },
] };
it.each(["دجاج", "لحم بقري"])("keeps the product gallery for %s without its own images", name => {
  expect(getProductImagesForVariant(product, { id: name, name, imageUrl: null, images: [], effectiveImageUrl: "/simba.jpg" })).toEqual(product.images);
});
it("prefers and deduplicates a variant's own images", () => {
  const result = getProductImagesForVariant(product, { id: "chicken", imageUrl: "/chicken.jpg", images: [{ url: "/chicken.jpg" }, { url: "/detail.jpg" }] });
  expect(result.map(image => image.url)).toEqual(["/chicken.jpg", "/detail.jpg"]);
});
it("falls back to the thumbnail when both galleries are empty", () => {
  expect(getProductImagesForVariant({ ...product, images: [] }, { id: "v", images: [] })[0].url).toBe("/simba.jpg");
});
it("ignores blank variant image records when falling back", () => {
  expect(getProductImagesForVariant(product, { images: [{ url: "" }] })).toEqual(product.images);
});
it("can use an effective variant image when no gallery supplies it", () => {
  expect(getProductImagesForVariant(product, { id: "v", effectiveImageUrl: "/variant.jpg" })[0].url).toBe("/variant.jpg");
});
it("keeps the product gallery when no variant is selected", () => {
  expect(getProductImagesForVariant(product, null)).toEqual(product.images);
});
it("returns an empty gallery only when no image is available", () => {
  expect(getProductImagesForVariant({}, { images: [] })).toEqual([]);
});
