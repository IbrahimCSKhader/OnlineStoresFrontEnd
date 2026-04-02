import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const couponApi = {
  getCouponsByStore: (storeId) => axiosInstance.get(endpoints.coupons.byStore(storeId)),
  getCouponById: (id) => axiosInstance.get(endpoints.coupons.detail(id)),
  createCoupon: (payload) => axiosInstance.post(endpoints.coupons.create, payload),
  updateCoupon: (id, payload) => axiosInstance.put(endpoints.coupons.detail(id), payload),
  deleteCoupon: (id) => axiosInstance.delete(endpoints.coupons.detail(id)),
};

export default couponApi;
