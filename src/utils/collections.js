const LIST_RESPONSE_KEYS = [
  "items",
  "data",
  "results",
  "stores",
  "products",
  "categories",
  "sections",
  "coupons",
  "customers",
  "customerStores",
  "users",
  "orders",
  "reviews",
];

const ENTITY_RESPONSE_KEYS = [
  "data",
  "item",
  "result",
  "store",
  "product",
  "category",
  "section",
  "coupon",
  "customer",
  "customerStore",
  "user",
  "order",
  "review",
];

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function findNestedArray(value, visited = new Set()) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isPlainObject(value) || visited.has(value)) {
    return null;
  }

  visited.add(value);

  for (const key of LIST_RESPONSE_KEYS) {
    const nested = findNestedArray(value[key], visited);
    if (nested) {
      return nested;
    }
  }

  return null;
}

export function normalizeListResponse(data) {
  return findNestedArray(data) ?? [];
}

export function normalizeEntityResponse(data) {
  let current = data;
  const visited = new Set();

  while (isPlainObject(current) && !visited.has(current)) {
    visited.add(current);

    const nested = ENTITY_RESPONSE_KEYS.find((key) => isPlainObject(current[key]));

    if (!nested) {
      break;
    }

    current = current[nested];
  }

  return current ?? null;
}
