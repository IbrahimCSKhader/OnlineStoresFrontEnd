import { normalizeEntityResponse } from "../../utils/collections.js";
import { isProductActive, normalizeProductDto } from "../../utils/products.js";
import { queryKeys } from "../../utils/queryKeys.js";

const LIST_CONTAINER_KEYS = ["products", "items", "data", "results"];

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function looksLikeProductEntity(entity) {
  if (!isPlainObject(entity)) {
    return false;
  }

  return [
    "name",
    "Name",
    "slug",
    "Slug",
    "price",
    "Price",
    "finalPrice",
    "FinalPrice",
    "storeId",
    "StoreId",
    "categoryId",
    "CategoryId",
  ].some((key) => key in entity);
}

function updateListLikeData(data, updater) {
  if (Array.isArray(data)) {
    return updater(data);
  }

  if (!isPlainObject(data)) {
    return data;
  }

  for (const key of LIST_CONTAINER_KEYS) {
    if (Array.isArray(data[key])) {
      return {
        ...data,
        [key]: updater(data[key]),
      };
    }
  }

  return data;
}

function upsertProduct(items, product) {
  const productId = String(product?.id || "").trim();

  if (!productId) {
    return Array.isArray(items) ? items : [];
  }

  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex(
    (item) => String(item?.id ?? item?.Id ?? "").trim() === productId,
  );

  if (index === -1) {
    return [product, ...list];
  }

  return list.map((item, currentIndex) =>
    currentIndex === index
      ? {
          ...item,
          ...product,
        }
      : item,
  );
}

function removeProduct(items, productId) {
  const normalizedProductId = String(productId || "").trim();

  if (!normalizedProductId) {
    return Array.isArray(items) ? items : [];
  }

  return (Array.isArray(items) ? items : []).filter(
    (item) => String(item?.id ?? item?.Id ?? "").trim() !== normalizedProductId,
  );
}

function syncListQuery(queryClient, queryKey, updater) {
  queryClient.setQueryData(queryKey, (currentData) =>
    updateListLikeData(currentData, updater),
  );
}

function normalizeProductFromResponse(productData) {
  const entity = normalizeEntityResponse(productData) ?? productData ?? null;

  if (!looksLikeProductEntity(entity)) {
    return null;
  }

  const product = normalizeProductDto(entity);
  return product?.id ? product : null;
}

export function syncProductFromResponse(queryClient, productData, options = {}) {
  const product = normalizeProductFromResponse(productData);

  if (!product) {
    return null;
  }

  const resolvedStoreId = String(
    options.storeId || product.storeId || "",
  ).trim();

  queryClient.setQueryData(queryKeys.products.detail(product.id), productData);

  if (product.slug) {
    queryClient.setQueryData(queryKeys.products.slug(product.slug), productData);
  }

  const productQueries = queryClient.getQueriesData({ queryKey: ["products"] });

  productQueries.forEach(([queryKey]) => {
    if (!Array.isArray(queryKey) || queryKey[0] !== "products") {
      return;
    }

    if (
      queryKey[1] === "store" &&
      resolvedStoreId &&
      String(queryKey[2] || "").trim() === resolvedStoreId
    ) {
      syncListQuery(queryClient, queryKey, (items) => upsertProduct(items, product));
      return;
    }

    if (
      queryKey[1] === "featured" &&
      resolvedStoreId &&
      String(queryKey[2] || "").trim() === resolvedStoreId
    ) {
      syncListQuery(queryClient, queryKey, (items) =>
        product.isFeatured && isProductActive(product)
          ? upsertProduct(items, product)
          : removeProduct(items, product.id),
      );
      return;
    }

    if (queryKey[1] === "category") {
      const matchesCategory =
        String(queryKey[2] || "").trim() === String(product.categoryId || "").trim();

      syncListQuery(queryClient, queryKey, (items) =>
        matchesCategory && isProductActive(product)
          ? upsertProduct(items, product)
          : removeProduct(items, product.id),
      );
      return;
    }

    if (queryKey[1] === "section") {
      const matchesSection =
        String(queryKey[2] || "").trim() === String(product.sectionId || "").trim();

      syncListQuery(queryClient, queryKey, (items) =>
        matchesSection && isProductActive(product)
          ? upsertProduct(items, product)
          : removeProduct(items, product.id),
      );
    }
  });

  return product;
}

export function removeProductFromCaches(queryClient, productId) {
  const normalizedProductId = String(productId || "").trim();

  if (!normalizedProductId) {
    return;
  }

  queryClient.removeQueries({
    queryKey: queryKeys.products.detail(normalizedProductId),
    exact: true,
  });

  const productQueries = queryClient.getQueriesData({ queryKey: ["products"] });

  productQueries.forEach(([queryKey]) => {
    if (
      !Array.isArray(queryKey) ||
      queryKey[0] !== "products" ||
      !["store", "featured", "category", "section"].includes(queryKey[1])
    ) {
      return;
    }

    syncListQuery(queryClient, queryKey, (items) =>
      removeProduct(items, normalizedProductId),
    );
  });
}
