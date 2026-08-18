import { isProductInStock } from "./products.js";

const UNCATEGORIZED_KEY = "__uncategorized__";

function normalizeLimit(value, fallback) {
  const limit = Number(value);
  return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : fallback;
}

function getCategoryKey(product) {
  return String(product?.categoryId || "").trim() || UNCATEGORIZED_KEY;
}

function getProductScore(product) {
  return (
    (product?.isFeatured ? 1000 : 0) +
    (isProductInStock(product) ? 100 : 0) +
    Number(product?.visitCount || 0)
  );
}

function buildCategoryLookup(categories) {
  const lookup = new Map();

  categories.forEach((category, index) => {
    const id = String(category?.id || "").trim();

    if (!id) return;

    lookup.set(id, {
      id,
      name: String(category?.name || "").trim() || "تصنيف",
      order: index,
    });
  });

  return lookup;
}

function addProductToGroup(groups, categoryLookup, product, index) {
  const productId = String(product?.id || "").trim();
  if (!productId) return;

  const categoryKey = getCategoryKey(product);
  const category = categoryLookup.get(categoryKey);
  const groupKey = category?.id || categoryKey;
  const isUncategorized = groupKey === UNCATEGORIZED_KEY;

  if (!groups.has(groupKey)) {
    groups.set(groupKey, {
      id: groupKey,
      name:
        category?.name ||
        String(product?.categoryName || "").trim() ||
        "منتجات أخرى",
      order: category?.order ?? categoryLookup.size + groups.size,
      isUncategorized,
      products: [],
    });
  }

  groups.get(groupKey).products.push({
    product,
    sourceIndex: index,
  });
}

export function buildBalancedCategoryHighlights(
  products,
  categories,
  options = {},
) {
  const maxItems = normalizeLimit(options.maxItems, 10);
  const categoryLookup = buildCategoryLookup(Array.isArray(categories) ? categories : []);
  const groups = new Map();
  const seenProducts = new Set();

  (Array.isArray(products) ? products : []).forEach((product, index) => {
    const productId = String(product?.id || "").trim();

    if (!productId || seenProducts.has(productId)) {
      return;
    }

    seenProducts.add(productId);
    addProductToGroup(groups, categoryLookup, product, index);
  });

  const categoryGroups = [...groups.values()]
    .map((group) => ({
      ...group,
      products: group.products
        .sort((left, right) => {
          const scoreDifference =
            getProductScore(right.product) - getProductScore(left.product);

          return scoreDifference || left.sourceIndex - right.sourceIndex;
        })
        .map((item) => item.product),
    }))
    .filter((group) => group.products.length)
    .sort((left, right) => {
      if (left.isUncategorized !== right.isUncategorized) {
        return Number(left.isUncategorized) - Number(right.isUncategorized);
      }

      return left.order - right.order;
    });

  const selected = [];
  let productIndex = 0;

  while (selected.length < maxItems) {
    let addedInRound = false;

    for (const group of categoryGroups) {
      const product = group.products[productIndex];

      if (!product) continue;

      selected.push({
        product,
        categoryId: group.id,
        categoryName: group.name,
      });
      addedInRound = true;

      if (selected.length >= maxItems) {
        break;
      }
    }

    if (!addedInRound) {
      break;
    }

    productIndex += 1;
  }

  return selected;
}
