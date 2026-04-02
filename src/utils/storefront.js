import { normalizeEntityResponse, normalizeListResponse } from "./collections.js";

export function getProductDisplayPrice(product) {
  return Number(product?.finalPrice ?? product?.price ?? product?.originalPrice ?? 0);
}

export function getProductComparePrice(product) {
  const compareAtPrice = Number(product?.compareAtPrice ?? 0);

  if (Number.isFinite(compareAtPrice) && compareAtPrice > 0) {
    return compareAtPrice;
  }

  const finalPrice = Number(product?.finalPrice);
  const originalPrice = Number(product?.originalPrice ?? product?.price ?? 0);

  if (Number.isFinite(finalPrice) && Number.isFinite(originalPrice) && originalPrice > finalPrice) {
    return originalPrice;
  }

  return 0;
}

export function getProductImage(product) {
  return product?.thumbnailUrl || product?.imageUrl || product?.images?.[0]?.url || "";
}

export function buildCategorySummary(products, categories) {
  return categories.map((category) => {
    const count = products.filter(
      (product) =>
        product.categoryId === category.id ||
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
    case "popular":
      return list.sort((left, right) => Number(right.visitCount ?? 0) - Number(left.visitCount ?? 0));
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

export function normalizeCartResponse(data) {
  const entity = normalizeEntityResponse(data) ?? data ?? {};
  const items = normalizeListResponse(entity?.items || entity?.cartItems || entity?.data || entity);

  const normalizedItems = items.map((item) => {
    const product = item.product || {};
    const variant = item.variant || {};

    return {
      id: firstString(item.id, item.cartItemId, product.id),
      productId: firstString(item.productId, product.id),
      name: firstString(item.productName, product.name, "منتج"),
      slug: firstString(product.slug),
      imageUrl: firstString(
        item.productThumbnail,
        item.thumbnailUrl,
        product.thumbnailUrl,
        product.imageUrl,
        product.images?.[0]?.url,
      ),
      quantity: firstNumber(item.quantity, item.qty, 1),
      unitPrice: firstNumber(item.unitPrice, item.price, item.productPrice, product.finalPrice, product.price),
      totalPrice: firstNumber(item.totalPrice, item.lineTotal, item.subtotal, item.totalAmount),
      variantId: firstString(item.variantId, variant.id),
      variantName: firstString(item.variantName, variant.name),
      availableStock: firstNumber(item.availableStock, item.stockQuantity, product.stockQuantity),
      raw: item,
    };
  });

  const serverSubtotal = firstNumber(entity?.subtotal, entity?.subTotal, entity?.totalAmount);
  const fallbackSubtotal = normalizedItems.reduce((sum, item) => {
    const lineTotal = item.totalPrice || item.unitPrice * item.quantity;
    return sum + lineTotal;
  }, 0);

  return {
    id: firstString(entity?.id, entity?.cartId),
    userId: firstString(entity?.userId),
    storeId: firstString(entity?.storeId),
    items: normalizedItems,
    itemCount:
      firstNumber(entity?.totalItems, entity?.itemCount) ||
      normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: serverSubtotal || fallbackSubtotal,
    totalAmount: firstNumber(entity?.totalAmount, entity?.grandTotal, serverSubtotal) || fallbackSubtotal,
    createdAt: firstString(entity?.createdAt),
  };
}
