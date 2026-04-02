import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const storeApi = {
  getStores: (params) => axiosInstance.get(endpoints.stores.list, { params }),
  createStore: (payload) => axiosInstance.post(endpoints.stores.create, payload),
  getStoreById: (id) => axiosInstance.get(endpoints.stores.detail(id)),
  getStoreBySlug: (slug) => axiosInstance.get(endpoints.stores.slug(slug)),
  updateStore: (id, payload) => axiosInstance.put(endpoints.stores.detail(id), payload),
  deleteStore: (id) => axiosInstance.delete(endpoints.stores.detail(id)),
  visitStore: (id) => axiosInstance.post(endpoints.stores.visit(id)),
  getStoreVisitCount: (id) => axiosInstance.get(endpoints.stores.visitCount(id)),
};

export default storeApi;
