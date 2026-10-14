import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const sectionApi = {
  getSectionsByStore: (storeId, params) =>
    axiosInstance.get(endpoints.sections.byStore(storeId), params ? { params } : undefined),
  getSectionById: (id, params) =>
    axiosInstance.get(endpoints.sections.detail(id), params ? { params } : undefined),
  createSection: (payload) => axiosInstance.post(endpoints.sections.create, payload),
  updateSection: (id, payload) => axiosInstance.put(endpoints.sections.detail(id), payload),
  deleteSection: (id) => axiosInstance.delete(endpoints.sections.detail(id)),
};

export default sectionApi;
