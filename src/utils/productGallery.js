export function getProductImagesForVariant(product, variant) {
  const productImages = (Array.isArray(product?.images) ? product.images : [])
    .filter(image => image?.url);
  if (!productImages.length && product?.thumbnailUrl) {
    productImages.push({ id: "thumbnail", url: product.thumbnailUrl, altText: product.name });
  }
  if (!variant) return productImages;

  const images = [];
  const directUrl = variant.imageUrl || variant.ImageUrl;
  if (directUrl) {
    images.push({
      id: `variant-primary-${variant.id}`,
      url: directUrl,
      altText: `${product?.name || ""} ${variant.name || ""}`.trim(),
    });
  }
  for (const image of Array.isArray(variant.images) ? variant.images : []) {
    if (image?.url && !images.some(item => item.url === image.url)) images.push(image);
  }
  if (images.length) return images;

  const effectiveUrl = variant.effectiveImageUrl || variant.EffectiveImageUrl;
  if (effectiveUrl && !productImages.some(image => image.url === effectiveUrl)) {
    return [{ id: `variant-effective-${variant.id}`, url: effectiveUrl, altText: product?.name }];
  }
  return productImages;
}
