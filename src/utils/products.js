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
    variantId: firstString(image?.variantId, image?.VariantId),
  };
}

function toOptionalNumber(...values) {
  const value = firstDefined(...values);

  if (value === undefined) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function normalizeVariantAttributeValue(attribute, index = 0) {
  const entity = normalizeEntityResponse(attribute) ?? attribute ?? {};
  const attributeValue = entity?.attributeValue || entity?.AttributeValue || {};
  const nestedAttribute =
    entity?.attribute ||
    entity?.Attribute ||
    attributeValue?.attribute ||
    attributeValue?.Attribute ||
    {};

  return {
    ...entity,
    id: firstString(
      entity?.id,
      entity?.Id,
      entity?.attributeValueId,
      entity?.AttributeValueId,
      `variant-attribute-${index + 1}`,
    ),
    attributeValueId: firstString(
      entity?.attributeValueId,
      entity?.AttributeValueId,
      attributeValue?.id,
      attributeValue?.Id,
    ),
    attributeId: firstString(
      entity?.attributeId,
      entity?.AttributeId,
      nestedAttribute?.id,
      nestedAttribute?.Id,
      attributeValue?.attributeId,
      attributeValue?.AttributeId,
    ),
    attributeName: firstString(
      entity?.attributeName,
      entity?.AttributeName,
      nestedAttribute?.name,
      nestedAttribute?.Name,
    ),
    value: firstString(
      entity?.value,
      entity?.Value,
      attributeValue?.value,
      attributeValue?.Value,
    ),
    raw: entity,
  };
}

export function normalizeProductVariantDto(variant, index = 0) {
  const entity = normalizeEntityResponse(variant) ?? variant ?? {};
  const stockQuantity = firstNumber(entity?.stockQuantity, entity?.StockQuantity);
  const price = toOptionalNumber(entity?.price, entity?.Price);
  const compareAtPrice = toOptionalNumber(entity?.compareAtPrice, entity?.CompareAtPrice);
  const legacyPriceOverride = toOptionalNumber(entity?.priceOverride, entity?.PriceOverride);
  const effectivePrice = toOptionalNumber(
    entity?.effectivePrice,
    entity?.EffectivePrice,
    price,
    legacyPriceOverride,
  );
  const effectiveCompareAtPrice = toOptionalNumber(
    entity?.effectiveCompareAtPrice,
    entity?.EffectiveCompareAtPrice,
    compareAtPrice,
  );
  const images = normalizeListResponse(entity?.images || entity?.Images)
    .map((image, imageIndex) => normalizeProductImage(image, imageIndex))
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const attributeValues = normalizeListResponse(
    entity?.attributeValues || entity?.AttributeValues,
  ).map((attribute, attributeIndex) =>
    normalizeVariantAttributeValue(attribute, attributeIndex),
  );

  return {
    ...entity,
    id: firstString(entity?.id, entity?.Id, `variant-${index + 1}`),
    name: firstString(entity?.name, entity?.Name, `خيار ${index + 1}`),
    sku: firstString(entity?.sku, entity?.SKU),
    description: firstString(entity?.description, entity?.Description),
    price,
    compareAtPrice,
    effectivePrice,
    effectiveCompareAtPrice,
    priceOverride: legacyPriceOverride,
    stockQuantity,
    imageUrl: firstString(entity?.imageUrl, entity?.ImageUrl),
    effectiveImageUrl: firstString(
      entity?.effectiveImageUrl,
      entity?.EffectiveImageUrl,
      entity?.imageUrl,
      entity?.ImageUrl,
      images[0]?.url,
    ),
    isDefault: toBoolean(entity?.isDefault ?? entity?.IsDefault, false),
    isActive: toBoolean(entity?.isActive ?? entity?.IsActive, true),
    sortOrder: firstNumber(entity?.sortOrder, entity?.SortOrder, index),
    attributeValues,
    images,
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
  const effectiveStockQuantity = firstNumber(
    entity?.effectiveStockQuantity,
    entity?.EffectiveStockQuantity,
    variants.length
      ? variants
          .filter((variant) => variant.isActive)
          .reduce((sum, variant) => sum + Number(variant.stockQuantity || 0), 0)
      : stockQuantity,
  );
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
    status !== 3 && (!trackInventory || effectiveStockQuantity > 0),
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
    hasVariants: toBoolean(
      entity?.hasVariants ?? entity?.HasVariants,
      variants.filter((variant) => variant.isActive).length > 1 ||
        variants.some((variant) => variant.isActive && !variant.isDefault),
    ),
    defaultVariantId: firstString(entity?.defaultVariantId, entity?.DefaultVariantId),
    effectiveStockQuantity,
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

export function getActiveProductVariants(product) {
  return (Array.isArray(product?.variants) ? product.variants : [])
    .filter((variant) => variant?.isActive !== false)
    .sort((left, right) => {
      if (left?.isDefault !== right?.isDefault) {
        return Number(Boolean(right?.isDefault)) - Number(Boolean(left?.isDefault));
      }

      return Number(left?.sortOrder ?? 0) - Number(right?.sortOrder ?? 0);
    });
}

export function getProductDisplayVariant(product) {
  const variants = getActiveProductVariants(product);

  if (!variants.length) {
    return null;
  }

  const defaultVariantId = firstString(product?.defaultVariantId, product?.DefaultVariantId);
  const backendDefault = defaultVariantId
    ? variants.find((variant) => String(variant.id) === String(defaultVariantId))
    : null;

  return backendDefault || variants.find((variant) => variant.isDefault) || variants[0] || null;
}

function getProductBaseDisplayPrice(product) {
  return firstNumber(product?.finalPrice, product?.FinalPrice, product?.price, product?.Price);
}

export function getProductDisplayPrice(product) {
  const defaultVariant = getProductDisplayVariant(product);

  return defaultVariant
    ? getVariantEffectivePrice(defaultVariant, product)
    : getProductBaseDisplayPrice(product);
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
  const defaultVariant = getProductDisplayVariant(product);

  return defaultVariant
    ? getVariantEffectiveComparePrice(defaultVariant, product)
    : firstNumber(product?.compareAtPrice, product?.CompareAtPrice);
}

function getProductBaseImage(product) {
  return firstString(
    product?.thumbnailUrl,
    product?.ThumbnailUrl,
    product?.imageUrl,
    product?.ImageUrl,
    product?.images?.find?.((image) => image?.isPrimary)?.url,
    product?.images?.[0]?.url,
  );
}

export function getProductImage(product) {
  const defaultVariant = getProductDisplayVariant(product);

  return defaultVariant
    ? getVariantEffectiveImage(defaultVariant, product)
    : getProductBaseImage(product);
}

export function getVariantAttributeLabel(variant) {
  const attributeValues = Array.isArray(variant?.attributeValues)
    ? variant.attributeValues
    : [];

  return attributeValues
    .filter((item) => item?.value)
    .map((item) =>
      item.attributeName ? `${item.attributeName}: ${item.value}` : item.value,
    )
    .join("، ");
}

export function getVariantEffectivePrice(variant, product) {
  return firstNumber(
    variant?.effectivePrice,
    variant?.EffectivePrice,
    variant?.price,
    variant?.Price,
    variant?.priceOverride,
    variant?.PriceOverride,
    getProductBaseDisplayPrice(product),
  );
}

export function getVariantEffectiveComparePrice(variant, product) {
  return firstNumber(
    variant?.effectiveCompareAtPrice,
    variant?.EffectiveCompareAtPrice,
    variant?.compareAtPrice,
    variant?.CompareAtPrice,
    product?.compareAtPrice,
    product?.CompareAtPrice,
  );
}

export function getVariantEffectiveImage(variant, product) {
  return firstString(
    variant?.effectiveImageUrl,
    variant?.EffectiveImageUrl,
    variant?.imageUrl,
    variant?.ImageUrl,
    variant?.images?.[0]?.url,
    getProductBaseImage(product),
  );
}

export function isProductInStock(product, variant = null) {
  if (variant) {
    if (product?.trackInventory === false || product?.TrackInventory === false) {
      return true;
    }

    const variantStockQuantity = firstNumber(variant?.stockQuantity, variant?.StockQuantity);
    return toBoolean(
      variant?.isInStock ?? variant?.IsInStock,
      variantStockQuantity > 0,
    );
  }

  const defaultVariant = getProductDisplayVariant(product);

  if (defaultVariant) {
    return isProductInStock(product, defaultVariant);
  }

  return toBoolean(
    product?.isInStock ?? product?.IsInStock,
    firstNumber(product?.stockQuantity, product?.StockQuantity) > 0,
  );
}
