import axiosInstance from "./axiosInstance.js";

const plans = "/api/subscription-plans";
const subscriptions = "/api/store-subscriptions";
const storage = "/api/system/storage";

export default {
  getPlans: () => axiosInstance.get(plans),
  savePlan: (id, payload) => id ? axiosInstance.put(`${plans}/${id}`, payload) : axiosInstance.post(plans, payload),
  deletePlan: (id) => axiosInstance.delete(`${plans}/${id}`),
  getSubscriptions: (storeId) => axiosInstance.get(`${subscriptions}/store/${storeId}`),
  assignSubscription: (payload) => axiosInstance.post(`${subscriptions}/assign`, payload),
  cancelSubscription: (id) => axiosInstance.put(`${subscriptions}/${id}/cancel`),
  ensureVariantFolders: () => axiosInstance.post(`${storage}/ensure-variant-folders`),
  cleanEmptyFolders: (dryRun) => axiosInstance.post(`${storage}/remove-empty-product-images-folders`, null, { params: { dryRun } }),
};
