import { getStorageJson, removeStorageItem, setStorageJson, storageKeys } from "./storage.js";
import {
  getVariantAttributeLabel,
  getVariantEffectiveImage,
  getVariantEffectivePrice,
  getProductDisplayPrice,
  getProductDisplayVariant,
  getProductImage,
  isProductInStock,
} from "./products.js";

function normalizeStoreId(storeId) {
  return storeId ? String(storeId) : "";
}

function normalizeVariantId(variantId) {
  return variantId ? String(variantId) : "";
}

function toNumber(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

function clampQuantityToStock(quantity, availableStock) {
  const normalizedQuantity = Math.max(1, toNumber(quantity, 1));
  const normalizedStock = Number(availableStock);

  if (!Number.isFinite(normalizedStock)) {
    return normalizedQuantity;
  }

  if (normalizedStock <= 0) {
    return 0;
  }

  return Math.min(normalizedQuantity, Math.max(1, Math.trunc(normalizedStock)));
}

function buildGuestCartItemId(productId, variantId) {
  return `${String(productId)}::${variantId || "default"}`;
}

function getGuestCartState() {
  const state = getStorageJson(storageKeys.guestCart, {});
  return state && typeof state === "object" ? state : {};
}

function saveGuestCartState(state) {
  const entries = Object.entries(state || {}).filter(([, cart]) => cart?.items?.length);

  if (!entries.length) {
    removeStorageItem(storageKeys.guestCart);
    return;
  }

  setStorageJson(storageKeys.guestCart, Object.fromEntries(entries));
}

function buildEmptyGuestCart(storeId) {
  const normalizedStoreId = normalizeStoreId(storeId);

  return {
    id: `guest-${normalizedStoreId}`,
    userId: "guest",
    storeId: normalizedStoreId,
    items: [],
    itemCount: 0,
    totalItems: 0,
    subtotal: 0,
    totalAmount: 0,
    createdAt: new Date().toISOString(),
    isGuestCart: true,
  };
}

function finalizeGuestCart(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  const subtotal = items.reduce(
    (sum, item) => sum + toNumber(item.totalPrice, toNumber(item.unitPrice) * toNumber(item.quantity, 1)),
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + toNumber(item.quantity, 1), 0);

  return {
    ...buildEmptyGuestCart(cart?.storeId),
    ...cart,
    items,
    subtotal,
    totalAmount: subtotal,
    itemCount,
    totalItems: itemCount,
    isGuestCart: true,
  };
}

function resolveProductSnapshot(snapshot = {}, fallback = {}) {
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};
  const backup = fallback && typeof fallback === "object" ? fallback : {};
  const unitPrice = toNumber(
    source.unitPrice,
    toNumber(source.finalPrice, toNumber(source.price, toNumber(source.originalPrice, toNumber(backup.unitPrice)))),
  );

  return {
    name: source.name || source.productName || backup.name || "منتج",
    slug: source.slug || backup.slug || "",
    imageUrl: source.imageUrl || getProductImage(source) || backup.imageUrl || "",
    unitPrice,
    variantName: source.variantName || source.variant?.name || backup.variantName || "",
    variantSku: source.variantSku || source.variantSKU || source.variant?.sku || backup.variantSku || "",
    variantAttributes:
      source.variantAttributes ||
      getVariantAttributeLabel(source.variant) ||
      backup.variantAttributes ||
      "",
    availableStock: toNumber(
      source.availableStock,
      toNumber(
        source.stockQuantity,
        toNumber(
          source.variant?.stockQuantity,
          toNumber(backup.availableStock, isProductInStock(source) ? 1 : 0),
        ),
      ),
    ),
  };
}

export function getGuestCart(storeId) {
  const normalizedStoreId = normalizeStoreId(storeId);

  if (!normalizedStoreId) {
    return buildEmptyGuestCart("");
  }

  const state = getGuestCartState();
  return finalizeGuestCart(state[normalizedStoreId] || buildEmptyGuestCart(normalizedStoreId));
}

export function getAllGuestCarts() {
  return Object.values(getGuestCartState()).map((cart) => finalizeGuestCart(cart));
}

export function addGuestCartItem(payload) {
  const storeId = normalizeStoreId(payload?.storeId);

  if (!storeId || !payload?.productId) {
    return getGuestCart(storeId);
  }

  const state = getGuestCartState();
  const currentCart = getGuestCart(storeId);
  const variantId = normalizeVariantId(payload?.variantId);
  const itemId = buildGuestCartItemId(payload.productId, variantId);
  const existingItem = currentCart.items.find((item) => item.id === itemId);
  const snapshot = resolveProductSnapshot(payload?.productSnapshot, existingItem);
  const quantity = clampQuantityToStock(
    toNumber(existingItem?.quantity, 0) + toNumber(payload?.quantity, 1),
    snapshot.availableStock,
  );

  if (quantity <= 0) {
    return currentCart;
  }

  const nextItem = {
    ...existingItem,
    ...snapshot,
    id: itemId,
    productId: String(payload.productId),
    variantId,
    quantity,
    totalPrice: snapshot.unitPrice * quantity,
  };

  const nextCart = finalizeGuestCart({
    ...currentCart,
    items: existingItem
      ? currentCart.items.map((item) => (item.id === itemId ? nextItem : item))
      : [...currentCart.items, nextItem],
  });

  state[storeId] = nextCart;
  saveGuestCartState(state);
  return nextCart;
}

export function updateGuestCartItem(storeId, cartItemId, payload = {}) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const currentCart = getGuestCart(normalizedStoreId);

  const nextCart = finalizeGuestCart({
    ...currentCart,
    items: currentCart.items.map((item) => {
      if (item.id !== cartItemId) return item;

      const quantity = clampQuantityToStock(
        toNumber(payload.quantity, item.quantity),
        item.availableStock,
      );

      if (quantity <= 0) {
        return null;
      }

      return {
        ...item,
        quantity,
        totalPrice: toNumber(item.unitPrice) * quantity,
      };
    }).filter(Boolean),
  });

  const state = getGuestCartState();
  state[normalizedStoreId] = nextCart;
  saveGuestCartState(state);
  return nextCart;
}

export function removeGuestCartItem(storeId, cartItemId) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const currentCart = getGuestCart(normalizedStoreId);
  const nextCart = finalizeGuestCart({
    ...currentCart,
    items: currentCart.items.filter((item) => item.id !== cartItemId),
  });

  const state = getGuestCartState();

  if (nextCart.items.length) {
    state[normalizedStoreId] = nextCart;
  } else {
    delete state[normalizedStoreId];
  }

  saveGuestCartState(state);
  return nextCart;
}

export function clearGuestCart(storeId) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = getGuestCartState();
  delete state[normalizedStoreId];
  saveGuestCartState(state);
  return buildEmptyGuestCart(normalizedStoreId);
}

export function clearAllGuestCarts() {
  removeStorageItem(storageKeys.guestCart);
}

export function buildProductSnapshot(product, options = {}) {
  const variant = options.variant || getProductDisplayVariant(product);
  const unitPrice = variant
    ? getVariantEffectivePrice(variant, product)
    : getProductDisplayPrice(product);

  return {
    name: product?.name || "منتج",
    slug: product?.slug || "",
    imageUrl: variant ? getVariantEffectiveImage(variant, product) : getProductImage(product),
    unitPrice: toNumber(unitPrice),
    variantName: variant?.name || "",
    variantSku: variant?.sku || "",
    variantAttributes: getVariantAttributeLabel(variant),
    availableStock:
      product?.trackInventory === false
        ? 999999
        : toNumber(
            variant?.stockQuantity,
            toNumber(
              product?.effectiveStockQuantity,
              toNumber(product?.stockQuantity, isProductInStock(product, variant) ? 1 : 0),
            ),
          ),
  };
}
