import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const categoryApi = {
  getCategoriesByStore: (storeId, params) =>
    axiosInstance.get(endpoints.categories.byStore(storeId), params ? { params } : undefined),
  getCategoryById: (id, params) =>
    axiosInstance.get(endpoints.categories.detail(id), params ? { params } : undefined),
  createCategory: (payload) =>
    axiosInstance.post(endpoints.categories.create, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    }),
  updateCategory: (id, payload) =>
    axiosInstance.put(endpoints.categories.detail(id), payload, {
      headers: {
        "Content-Type": "application/json",
      },
    }),
  deleteCategory: (id) => axiosInstance.delete(endpoints.categories.detail(id)),
};

export default categoryApi;
