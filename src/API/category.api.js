import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

function categoryRequest(payload) {
  const { imageFile, ...fields } = payload;
  if (!imageFile) {
    return { data: fields, headers: { "Content-Type": "application/json" } };
  }
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) data.append(key, String(value));
  });
  data.append("ImageFile", imageFile);
  // Let the browser supply the multipart boundary instead of the JSON default.
  return { data, headers: { "Content-Type": undefined } };
}

export const categoryApi = {
  getCategoriesByStore: (storeId, params) =>
    axiosInstance.get(endpoints.categories.byStore(storeId), params ? { params } : undefined),
  getCategoryById: (id, params) =>
    axiosInstance.get(endpoints.categories.detail(id), params ? { params } : undefined),
  createCategory: (payload) => {
    const { data, headers } = categoryRequest(payload);
    return axiosInstance.post(endpoints.categories.create, data, { headers });
  },
  updateCategory: (id, payload) => {
    const { data, headers } = categoryRequest(payload);
    return axiosInstance.put(endpoints.categories.detail(id), data, { headers });
  },
  deleteCategory: (id) => axiosInstance.delete(endpoints.categories.detail(id)),
};

export default categoryApi;
