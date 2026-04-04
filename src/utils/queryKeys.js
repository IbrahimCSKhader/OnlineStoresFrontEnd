export const queryKeys = {
  auth: {
    me: ["auth", "me"],
  },
  stores: {
    all: ["stores"],
    detail: (id) => ["stores", id],
    slug: (slug) => ["stores", "slug", slug],
    visitCount: (id) => ["stores", id, "visit-count"],
  },
  sections: {
    byStore: (storeId) => ["sections", "store", storeId],
    detail: (id) => ["sections", id],
  },
  categories: {
    byStore: (storeId) => ["categories", "store", storeId],
    detail: (id) => ["categories", id],
  },
  products: {
    byStore: (storeId, params = {}) => ["products", "store", storeId, params],
    featured: (storeId) => ["products", "featured", storeId],
    detail: (id) => ["products", id],
    slug: (slug) => ["products", "slug", slug],
    byCategory: (categoryId) => ["products", "category", categoryId],
    bySection: (sectionId) => ["products", "section", sectionId],
    visitCount: (id) => ["products", id, "visit-count"],
  },
  cart: {
    byStore: (storeId) => ["cart", "store", storeId],
  },
  coupons: {
    byStore: (storeId) => ["coupons", "store", storeId],
    detail: (id) => ["coupons", id],
  },
  customerStores: {
    byStore: (storeId) => ["customer-stores", "store", storeId],
    availableCustomers: (storeId) => [
      "customer-stores",
      "store",
      storeId,
      "available-customers",
    ],
    detail: (id) => ["customer-stores", id],
  },
  orders: {
    mine: ["orders", "mine"],
    myDetail: (orderId) => ["orders", "mine", orderId],
    byStore: (storeId) => ["orders", "store", storeId],
    storeDetail: (storeId, orderId) => ["orders", "store", storeId, orderId],
  },
  reviews: {
    byStore: (storeId) => ["reviews", "store", storeId],
    byProduct: (productId) => ["reviews", "product", productId],
    myProductReview: (productId) => ["reviews", "product", productId, "mine"],
  },
  superAdmin: {
    root: ["super-admin"],
    summary: ["super-admin", "summary"],
    owners: ["super-admin", "owners"],
    ownerDetail: (ownerId) => ["super-admin", "owners", ownerId],
    stores: ["super-admin", "stores"],
    storeDetail: (storeId) => ["super-admin", "stores", storeId],
    storeCustomers: (storeId) => ["super-admin", "stores", storeId, "customers"],
  },
};
