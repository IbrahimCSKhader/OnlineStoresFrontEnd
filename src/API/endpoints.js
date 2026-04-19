const API_PREFIX = "/api";

const withPrefix = (path) => `${API_PREFIX}${path}`;

export const endpoints = {
  auth: {
    register: withPrefix("/Auth/register"),
    login: withPrefix("/Auth/login"),
    verifyEmail: withPrefix("/Auth/verify-email"),
    resendVerificationCode: withPrefix("/Auth/resend-verification-code"),
    forgotPassword: withPrefix("/Auth/forgot-password"),
    resetPassword: withPrefix("/Auth/reset-password"),
    logout: withPrefix("/Auth/logout"),
    google: withPrefix("/Auth/google"),
    googleCallback: withPrefix("/Auth/google-callback"),
    createOwner: withPrefix("/Auth/create-owner"),
    adminChangePassword: withPrefix("/Auth/admin/change-password"),
  },
  storeCustomerAuth: {
    register: withPrefix("/store-customer-auth/register"),
    login: withPrefix("/store-customer-auth/login"),
    storeLogin: (storeId) => withPrefix(`/store-customer-auth/store/${storeId}/login`),
    google: withPrefix("/store-customer-auth/google"),
    googleCallback: withPrefix("/store-customer-auth/google-callback"),
    forgotPassword: withPrefix("/store-customer-auth/forgot-password"),
    resetPassword: withPrefix("/store-customer-auth/reset-password"),
    setPassword: withPrefix("/store-customer-auth/set-password"),
    setPasswordFromAuthUser: (storeId) =>
      withPrefix(`/store-customer-auth/store/${storeId}/set-password-from-auth-user`),
    verifyEmail: withPrefix("/store-customer-auth/verify-email"),
    resendVerificationCode: withPrefix(
      "/store-customer-auth/resend-verification-code",
    ),
  },
  stores: {
    list: withPrefix("/Store"),
    create: withPrefix("/Store"),
    owned: withPrefix("/Store/owned"),
    detail: (id) => withPrefix(`/Store/${id}`),
    slug: (slug) => withPrefix(`/Store/slug/${slug}`),
    subscription: (id) => withPrefix(`/Store/${id}/subscription`),
    visit: (id) => withPrefix(`/Store/${id}/visit`),
    visitCount: (id) => withPrefix(`/Store/${id}/visit-count`),
  },
  sections: {
    create: withPrefix("/Section"),
    byStore: (storeId) => withPrefix(`/Section/store/${storeId}`),
    detail: (id) => withPrefix(`/Section/${id}`),
  },
  categories: {
    create: withPrefix("/Category"),
    byStore: (storeId) => withPrefix(`/Category/store/${storeId}`),
    detail: (id) => withPrefix(`/Category/${id}`),
  },
  products: {
    create: withPrefix("/Product"),
    byStore: (storeId) => withPrefix(`/Product/store/${storeId}`),
    featured: (storeId) => withPrefix(`/Product/featured/${storeId}`),
    byCategory: (categoryId) => withPrefix(`/Product/category/${categoryId}`),
    bySection: (sectionId) => withPrefix(`/Product/section/${sectionId}`),
    slug: (slug) => withPrefix(`/Product/slug/${slug}`),
    detail: (id) => withPrefix(`/Product/${id}`),
    visit: (id) => withPrefix(`/Product/${id}/visit`),
    visitCount: (id) => withPrefix(`/Product/${id}/visit-count`),
    createVariant: (productId) => withPrefix(`/Product/${productId}/variant`),
    deleteVariant: (variantId) => withPrefix(`/Product/variant/${variantId}`),
    uploadImage: withPrefix("/Product/image"),
    deleteImage: (imageId) => withPrefix(`/Product/image/${imageId}`),
  },
  reviews: {
    create: withPrefix("/Review"),
    byStore: (storeId) => withPrefix(`/Review/store/${storeId}`),
    byProduct: (productId) => withPrefix(`/Review/product/${productId}`),
    myProductReview: (productId) =>
      withPrefix(`/Review/product/${productId}/my-review`),
    detail: (reviewId) => withPrefix(`/Review/${reviewId}`),
    approval: (reviewId) => withPrefix(`/Review/${reviewId}/approval`),
  },
  cart: {
    byStore: (storeId) => withPrefix(`/Cart/${storeId}`),
    add: withPrefix("/Cart/add"),
    item: (cartItemId) => withPrefix(`/Cart/item/${cartItemId}`),
    clear: (storeId) => withPrefix(`/Cart/clear/${storeId}`),
  },
  coupons: {
    create: withPrefix("/Coupon"),
    byStore: (storeId) => withPrefix(`/Coupon/store/${storeId}`),
    detail: (id) => withPrefix(`/Coupon/${id}`),
  },
  customerStores: {
    create: withPrefix("/CustomerStore"),
    byStore: (storeId) => withPrefix(`/CustomerStore/store/${storeId}`),
    detail: (id) => withPrefix(`/CustomerStore/${id}`),
    availableCustomers: withPrefix("/CustomerStore/customers"),
  },
  orders: {
    create: withPrefix("/Order"),
    mine: withPrefix("/Order/my-orders"),
    myDetail: (orderId) => withPrefix(`/Order/my-orders/${orderId}`),
    byStore: (storeId) => withPrefix(`/Order/store/${storeId}`),
    storeDetail: (storeId, orderId) =>
      withPrefix(`/Order/store/${storeId}/${orderId}`),
    updateStatus: (orderId) => withPrefix(`/Order/${orderId}/status`),
  },
  superAdminDashboard: {
    summary: withPrefix("/super-admin-dashboard/summary"),
    owners: withPrefix("/super-admin-dashboard/owners"),
    ownerDetail: (ownerId) =>
      withPrefix(`/super-admin-dashboard/owners/${ownerId}`),
    ownerStatus: (ownerId) =>
      withPrefix(`/super-admin-dashboard/owners/${ownerId}/status`),
    stores: withPrefix("/super-admin-dashboard/stores"),
    storeDetail: (storeId) =>
      withPrefix(`/super-admin-dashboard/stores/${storeId}`),
    storeStatus: (storeId) =>
      withPrefix(`/super-admin-dashboard/stores/${storeId}/status`),
    storeCustomers: (storeId) =>
      withPrefix(`/super-admin-dashboard/stores/${storeId}/customers`),
  },
};

export default endpoints;
