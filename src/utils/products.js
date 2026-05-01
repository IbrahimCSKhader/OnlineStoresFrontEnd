import { normalizeEntityResponse, normalizeListResponse } from "./collections.js";

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function firstString(...values) {
  return firstDefined(...values) || "";
}

function firstNumber(...values) {
  for (const value of values) {
    const amount = Number(value);

    if (Number.isFinite(amount)) {
      return amount;
    }
  }

  return 0;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }

  return Boolean(value);
}

function normalizeProductImage(image, index = 0) {
  return {
    ...image,
    id: firstString(image?.id, image?.Id, `image-${index + 1}`),
    url: firstString(image?.url, image?.Url, image?.imageUrl, image?.ImageUrl),
    altText: firstString(image?.altText, image?.AltText),
    displayOrder: firstNumber(image?.displayOrder, image?.DisplayOrder, index),
    isPrimary: toBoolean(image?.isPrimary ?? image?.IsPrimary, index === 0),
  };
}

export function normalizeProductVariantDto(variant, index = 0) {
  const entity = normalizeEntityResponse(variant) ?? variant ?? {};
  const stockQuantity = firstNumber(entity?.stockQuantity, entity?.StockQuantity);
  const priceOverride = firstDefined(entity?.priceOverride, entity?.PriceOverride);

  return {
    ...entity,
    id: firstString(entity?.id, entity?.Id, `variant-${index + 1}`),
    name: firstString(entity?.name, entity?.Name, `خيار ${index + 1}`),
    sku: firstString(entity?.sku, entity?.SKU),
    priceOverride:
      priceOverride !== undefined && priceOverride !== null && priceOverride !== ""
        ? firstNumber(priceOverride)
        : null,
    stockQuantity,
    imageUrl: firstString(entity?.imageUrl, entity?.ImageUrl),
    isInStock: toBoolean(entity?.isInStock ?? entity?.IsInStock, stockQuantity > 0),
    raw: entity,
  };
}

function normalizeProductAttributeValue(attribute, index = 0) {
  const entity = normalizeEntityResponse(attribute) ?? attribute ?? {};

  return {
    ...entity,
    id: firstString(entity?.id, entity?.Id, `attribute-${index + 1}`),
    attributeId: firstString(entity?.attributeId, entity?.AttributeId),
    attributeName: firstString(
      entity?.attributeName,
      entity?.AttributeName,
      entity?.attribute?.name,
      entity?.Attribute?.Name,
    ),
    value: firstString(entity?.value, entity?.Value),
    raw: entity,
  };
}

export function normalizeProductDto(product) {
  const entity = normalizeEntityResponse(product) ?? product ?? {};
  const rawImages = normalizeListResponse(
    entity?.images || entity?.Images || entity?.productImages || entity?.ProductImages,
  );
  const images = rawImages
    .map((image, index) => normalizeProductImage(image, index))
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) {
        return Number(right.isPrimary) - Number(left.isPrimary);
      }

      return left.displayOrder - right.displayOrder;
    });
  const variants = normalizeListResponse(entity?.variants || entity?.Variants).map(
    (variant, index) => normalizeProductVariantDto(variant, index),
  );
  const attributeValues = normalizeListResponse(
    entity?.attributeValues || entity?.AttributeValues,
  ).map((attribute, index) => normalizeProductAttributeValue(attribute, index));
  const finalPrice = firstNumber(entity?.finalPrice, entity?.FinalPrice, entity?.price, entity?.Price);
  const originalPrice = firstNumber(
    entity?.originalPrice,
    entity?.OriginalPrice,
    entity?.price,
    entity?.Price,
    finalPrice,
  );
  const compareAtPrice = firstNumber(entity?.compareAtPrice, entity?.CompareAtPrice);
  const discountPercentage = firstNumber(
    entity?.discountPercentage,
    entity?.DiscountPercentage,
    originalPrice > finalPrice && originalPrice > 0
      ? ((originalPrice - finalPrice) / originalPrice) * 100
      : 0,
  );
  const stockQuantity = firstNumber(entity?.stockQuantity, entity?.StockQuantity);
  const trackInventory = toBoolean(entity?.trackInventory ?? entity?.TrackInventory, false);
  const status = firstNumber(entity?.status, entity?.Status, 1);
  const isWholesalePriceApplied = toBoolean(
    entity?.isWholesalePriceApplied ?? entity?.IsWholesalePriceApplied,
    false,
  );
  const hasDiscount = toBoolean(
    entity?.hasDiscount ?? entity?.HasDiscount,
    discountPercentage > 0 || compareAtPrice > finalPrice,
  );
  const isInStock = toBoolean(
    entity?.isInStock ?? entity?.IsInStock,
    status !== 3 && (!trackInventory || stockQuantity > 0),
  );
  const thumbnailUrl = firstString(
    entity?.thumbnailUrl,
    entity?.ThumbnailUrl,
    images.find((image) => image.isPrimary)?.url,
    images[0]?.url,
    entity?.imageUrl,
    entity?.ImageUrl,
  );

  return {
    ...entity,
    id: firstString(entity?.id, entity?.Id),
    name: firstString(entity?.name, entity?.Name, "منتج"),
    fullName: firstString(entity?.fullName, entity?.FullName, entity?.name, entity?.Name, "منتج"),
    slug: firstString(entity?.slug, entity?.Slug),
    storeId: firstString(entity?.storeId, entity?.StoreId),
    storeSlug: firstString(entity?.storeSlug, entity?.StoreSlug, entity?.store?.slug),
    categoryId: firstString(entity?.categoryId, entity?.CategoryId),
    categoryName: firstString(entity?.categoryName, entity?.CategoryName),
    sectionId: firstString(entity?.sectionId, entity?.SectionId),
    sectionName: firstString(entity?.sectionName, entity?.SectionName),
    sku: firstString(entity?.sku, entity?.SKU),
    description: firstString(entity?.description, entity?.Description),
    shortDescription: firstString(entity?.shortDescription, entity?.ShortDescription),
    thumbnailUrl,
    imageUrl: firstString(entity?.imageUrl, entity?.ImageUrl, thumbnailUrl),
    images,
    variants,
    attributeValues,
    price: firstNumber(entity?.price, entity?.Price, finalPrice),
    finalPrice,
    originalPrice,
    compareAtPrice,
    wholesalePrice: firstDefined(entity?.wholesalePrice, entity?.WholesalePrice) !== undefined
      ? firstNumber(entity?.wholesalePrice, entity?.WholesalePrice)
      : null,
    costPrice: firstDefined(entity?.costPrice, entity?.CostPrice) !== undefined
      ? firstNumber(entity?.costPrice, entity?.CostPrice)
      : null,
    discountPercentage,
    hasDiscount,
    isWholesalePriceApplied,
    stockQuantity,
    trackInventory,
    isInStock,
    status,
    isFeatured: toBoolean(entity?.isFeatured ?? entity?.IsFeatured, false),
    visitCount: firstNumber(entity?.visitCount, entity?.VisitCount),
    metaTitle: firstString(entity?.metaTitle, entity?.MetaTitle),
    metaDescription: firstString(entity?.metaDescription, entity?.MetaDescription),
    createdAt: firstString(entity?.createdAt, entity?.CreatedAt),
    updatedAt: firstString(entity?.updatedAt, entity?.UpdatedAt),
    raw: entity,
  };
}

export function normalizeProductList(products) {
  return normalizeListResponse(products)
    .map((product) => normalizeProductDto(product))
    .filter((product) => product.id);
}

export function dedupeProducts(products) {
  const seen = new Set();

  return products.filter((product) => {
    const key = String(product?.id || "").trim();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function isProductActive(product) {
  return firstNumber(product?.status, product?.Status, 1) === 1;
}

export function getProductDisplayPrice(product) {
  return firstNumber(product?.finalPrice, product?.FinalPrice, product?.price, product?.Price);
}

export function getProductOriginalPrice(product) {
  return firstNumber(
    product?.originalPrice,
    product?.OriginalPrice,
    product?.price,
    product?.Price,
    getProductDisplayPrice(product),
  );
}

export function getProductComparePrice(product) {
  return firstNumber(product?.compareAtPrice, product?.CompareAtPrice);
}

export function getProductImage(product) {
  return firstString(
    product?.thumbnailUrl,
    product?.ThumbnailUrl,
    product?.imageUrl,
    product?.ImageUrl,
    product?.images?.find?.((image) => image?.isPrimary)?.url,
    product?.images?.[0]?.url,
  );
}

export function isProductInStock(product, variant = null) {
  if (variant) {
    const variantStockQuantity = firstNumber(variant?.stockQuantity, variant?.StockQuantity);
    return toBoolean(
      variant?.isInStock ?? variant?.IsInStock,
      variantStockQuantity > 0,
    );
  }

  return toBoolean(
    product?.isInStock ?? product?.IsInStock,
    firstNumber(product?.stockQuantity, product?.StockQuantity) > 0,
  );
}
