import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const categoryApi = {
  getCategoriesByStore: (storeId) =>
    axiosInstance.get(endpoints.categories.byStore(storeId)),
  getCategoryById: (id) => axiosInstance.get(endpoints.categories.detail(id)),
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
