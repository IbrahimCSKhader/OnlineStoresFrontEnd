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
  },
  stores: {
    list: withPrefix("/Store"),
    create: withPrefix("/Store"),
    detail: (id) => withPrefix(`/Store/${id}`),
    slug: (slug) => withPrefix(`/Store/slug/${slug}`),
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
    myProductReview: (productId) => withPrefix(`/Review/product/${productId}/my-review`),
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
  orders: {
    create: withPrefix("/Order"),
    mine: withPrefix("/Order/my-orders"),
    myDetail: (orderId) => withPrefix(`/Order/my-orders/${orderId}`),
    byStore: (storeId) => withPrefix(`/Order/store/${storeId}`),
    storeDetail: (storeId, orderId) => withPrefix(`/Order/store/${storeId}/${orderId}`),
    updateStatus: (orderId) => withPrefix(`/Order/${orderId}/status`),
  },
};

export default endpoints;
