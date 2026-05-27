import { normalizeEntityResponse, normalizeListResponse } from "./collections.js";
import {
  getProductComparePrice,
  getProductDisplayPrice,
  getProductImage,
  getVariantAttributeLabel,
  getVariantEffectiveImage,
  normalizeProductVariantDto,
  normalizeProductDto,
} from "./products.js";

export { getProductComparePrice, getProductDisplayPrice, getProductImage };

export function buildCategorySummary(products, categories) {
  return categories.map((category) => {
    const count = products.filter(
      (product) =>
        String(product.categoryId || "") === String(category.id || "") ||
        String(product.categoryName || "").trim() === String(category.name || "").trim(),
    ).length;

    return {
      ...category,
      count,
    };
  });
}

export function sortProducts(products, sortValue) {
  const list = [...products];

  switch (sortValue) {
    case "price-asc":
      return list.sort((left, right) => getProductDisplayPrice(left) - getProductDisplayPrice(right));
    case "price-desc":
      return list.sort((left, right) => getProductDisplayPrice(right) - getProductDisplayPrice(left));
    case "newest":
      return list.sort(
        (left, right) =>
          new Date(right.createdAt || right.createdOn || 0) -
          new Date(left.createdAt || left.createdOn || 0),
      );
    default:
      return list.sort((left, right) =>
        String(left.name || "").localeCompare(String(right.name || ""), "ar"),
      );
  }
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

function firstString(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") || "";
}

function firstNestedImageUrl(images) {
  return normalizeListResponse(images)
    .map((image) =>
      firstString(image?.url, image?.Url, image?.imageUrl, image?.ImageUrl),
    )
    .find(Boolean) || "";
}

function formatVariantAttributes(value) {
  if (!Array.isArray(value)) {
    return typeof value === "string" ? value : "";
  }

  return value
    .map((item) => {
      const attributeName = firstString(item?.attributeName, item?.AttributeName);
      const attributeValue = firstString(item?.value, item?.Value);

      if (!attributeValue) {
        return "";
      }

      return attributeName ? `${attributeName}: ${attributeValue}` : attributeValue;
    })
    .filter(Boolean)
    .join("، ");
}

export function normalizeCartResponse(data) {
  const entity = normalizeEntityResponse(data) ?? data ?? {};
  const items = normalizeListResponse(entity?.items || entity?.cartItems || entity?.data || entity);
  const storeCustomerId = firstString(
    entity?.storeCustomerId,
    entity?.customerStoreId,
    entity?.CustomerStoreId,
    entity?.userId,
  );

  const normalizedItems = items.map((item) => {
    const product = normalizeProductDto(item.product || item.Product || {});
    const rawVariant = item.variant || item.Variant || null;
    const variant = rawVariant ? normalizeProductVariantDto(rawVariant) : {};
    const productId = firstString(item.productId, item.ProductId, product.id);
    const variantId = firstString(item.variantId, item.VariantId, variant.id);
    const variantImageUrl = firstString(
      item.variantImageUrl,
      item.VariantImageUrl,
      variant.imageUrl,
      variant.ImageUrl,
      firstNestedImageUrl(variant.images),
      firstNestedImageUrl(item.variantImages || item.VariantImages),
    );
    const effectiveVariantImageUrl = firstString(
      item.effectiveVariantImageUrl,
      item.EffectiveVariantImageUrl,
      variant.effectiveImageUrl,
      variant.EffectiveImageUrl,
      variantImageUrl,
      rawVariant ? getVariantEffectiveImage(variant, product) : "",
    );
    const productImageUrl = firstString(
      item.productThumbnail,
      item.ProductThumbnail,
      item.thumbnailUrl,
      item.ThumbnailUrl,
      product.thumbnailUrl,
      product.imageUrl,
      firstNestedImageUrl(product.images),
    );
    const variantAttributes = firstString(
      formatVariantAttributes(item.variantAttributes),
      formatVariantAttributes(item.VariantAttributes),
      formatVariantAttributes(item.variantAttributeValues),
      formatVariantAttributes(item.VariantAttributeValues),
      item.variantAttributesText,
      item.VariantAttributesText,
      getVariantAttributeLabel(variant),
    );

    return {
      id: firstString(
        item.id,
        item.Id,
        item.cartItemId,
        item.CartItemId,
        productId && variantId ? `${productId}::${variantId}` : productId,
      ),
      productId,
      name: firstString(item.productName, item.ProductName, product.name, "منتج"),
      slug: firstString(product.slug),
      imageUrl: firstString(
        effectiveVariantImageUrl,
        variantImageUrl,
        productImageUrl,
      ),
      variantImageUrl,
      effectiveVariantImageUrl,
      productThumbnail: productImageUrl,
      quantity: firstNumber(item.quantity, item.Quantity, item.qty, item.Qty, 1),
      unitPrice: firstNumber(
        item.unitPrice,
        item.UnitPrice,
        item.price,
        item.Price,
        item.productPrice,
        item.ProductPrice,
        product.finalPrice,
        product.originalPrice,
        product.price,
      ),
      totalPrice: firstNumber(
        item.totalPrice,
        item.TotalPrice,
        item.lineTotal,
        item.LineTotal,
        item.subtotal,
        item.Subtotal,
        item.totalAmount,
        item.TotalAmount,
      ),
      variantId,
      variantName: firstString(item.variantName, item.VariantName, variant.name),
      variantSku: firstString(
        item.variantSku,
        item.variantSKU,
        item.VariantSKU,
        item.VariantSku,
        variant.sku,
      ),
      variantAttributes,
      availableStock: firstNumber(
        item.availableStock,
        item.AvailableStock,
        item.variantStockQuantity,
        item.VariantStockQuantity,
        variant.stockQuantity,
        item.stockQuantity,
        item.StockQuantity,
        product.effectiveStockQuantity,
        product.stockQuantity,
      ),
      raw: item,
    };
  });

  const serverSubtotal = firstNumber(entity?.subtotal, entity?.subTotal);
  const serverDiscount = firstNumber(entity?.discount, entity?.discountAmount);
  const serverFinalTotal = firstNumber(
    entity?.finalTotal,
    entity?.grandTotal,
    entity?.totalAmount,
  );
  const fallbackSubtotal = normalizedItems.reduce((sum, item) => {
    const lineTotal = item.totalPrice || item.unitPrice * item.quantity;
    return sum + lineTotal;
  }, 0);

  return {
    id: firstString(entity?.id, entity?.cartId),
    storeCustomerId,
    customerStoreId: storeCustomerId,
    userId: storeCustomerId,
    storeId: firstString(entity?.storeId),
    items: normalizedItems,
    discount: serverDiscount,
    appliedOffers: normalizeListResponse(entity?.appliedOffers),
    itemCount:
      firstNumber(entity?.totalItems, entity?.itemCount) ||
      normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: serverSubtotal || fallbackSubtotal,
    totalAmount:
      serverFinalTotal ||
      Math.max((serverSubtotal || fallbackSubtotal) - serverDiscount, 0),
    finalTotal:
      serverFinalTotal ||
      Math.max((serverSubtotal || fallbackSubtotal) - serverDiscount, 0),
    createdAt: firstString(entity?.createdAt),
  };
}
