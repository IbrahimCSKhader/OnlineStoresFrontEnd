import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const reviewApi = {
  getReviewsByStore: (storeId) => axiosInstance.get(endpoints.reviews.byStore(storeId)),
  getReviewsByProduct: (productId) => axiosInstance.get(endpoints.reviews.byProduct(productId)),
  getMyReviewForProduct: (productId) => axiosInstance.get(endpoints.reviews.myProductReview(productId)),
  createReview: (payload) => axiosInstance.post(endpoints.reviews.create, payload),
  updateReview: (reviewId, payload) => axiosInstance.put(endpoints.reviews.detail(reviewId), payload),
  deleteReview: (reviewId) => axiosInstance.delete(endpoints.reviews.detail(reviewId)),
  updateReviewApproval: (reviewId, payload) =>
    axiosInstance.put(endpoints.reviews.approval(reviewId), payload),
};

export default reviewApi;
